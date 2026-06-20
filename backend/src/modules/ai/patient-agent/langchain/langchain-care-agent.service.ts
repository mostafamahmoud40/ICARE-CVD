import { Injectable, Logger } from '@nestjs/common';
import { createAgent } from 'langchain';
import { ChatGroq } from '@langchain/groq';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';

import type {
  PatientAiChatResponse,
  PatientAgentAction,
} from '../../dto/patient-ai-chat.dto';
import { buildPatientAppointmentLangChainTools } from './patient-appointment.langchain-tools';
import { PatientAppointmentToolsService } from './patient-appointment-tools.service';

export type LangChainAgentInput = {
  apiKey: string;
  model: string;
  systemPrompt: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  userId: number;
};

@Injectable()
export class LangChainCareAgentService {
  private readonly logger = new Logger(LangChainCareAgentService.name);

  constructor(
    private readonly appointmentToolsService: PatientAppointmentToolsService,
  ) {}

  async invoke(input: LangChainAgentInput): Promise<PatientAiChatResponse> {
    const tools = buildPatientAppointmentLangChainTools(
      this.appointmentToolsService,
      input.userId,
    );

    const isReasoningModel = /qwq|qwen3|gpt-oss|r1|deepseek-r1/i.test(
      input.model,
    );

    const llm = new ChatGroq({
      apiKey: input.apiKey,
      model: input.model,
      temperature: isReasoningModel ? 0.6 : 0.45,
      maxTokens: isReasoningModel ? 2048 : 900,
    });

    const agent = createAgent({
      model: llm,
      tools,
      systemPrompt: input.systemPrompt,
    });

    const messages: BaseMessage[] = [
      ...input.history.map((h) =>
        h.role === 'user'
          ? new HumanMessage(h.content)
          : new AIMessage(h.content),
      ),
      new HumanMessage(input.message),
    ];

    try {
      const result = await agent.invoke({ messages });
      return this.parseAgentResult(result.messages as BaseMessage[]);
    } catch (error) {
      if (this.isGroqToolUseFailed(error)) {
        const recovered = this.recoverFromToolUseFailed(error);
        if (recovered) {
          this.logger.warn(
            'LangChain Groq tool_use_failed — returning confirmation text',
          );
          return { reply: recovered };
        }
      }
      throw error;
    }
  }

  private parseAgentResult(messages: BaseMessage[]): PatientAiChatResponse {
    let booking: PatientAiChatResponse['booking'];
    let appointmentsUpdated = false;
    const agentActions: PatientAgentAction[] = [];

    const toolCallNameById = new Map<string, string>();
    for (const msg of messages) {
      if (msg instanceof AIMessage && msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          if (tc.id && tc.name) toolCallNameById.set(tc.id, tc.name);
        }
      }
    }

    for (const msg of messages) {
      if (!(msg instanceof ToolMessage)) continue;
      const toolName =
        toolCallNameById.get(msg.tool_call_id) ?? 'unknown_tool';
      let data: unknown = msg.content;
      if (typeof msg.content === 'string') {
        try {
          data = JSON.parse(msg.content);
        } catch {
          data = { message: msg.content };
        }
      }

      agentActions.push(
        this.appointmentToolsService.formatAgentAction(toolName, data),
      );

      if (data && typeof data === 'object') {
        const payload = data as Record<string, unknown>;
        if (payload.success === true) {
          if (
            toolName === 'book_appointment' &&
            typeof payload.confirmationCode === 'string'
          ) {
            booking = {
              confirmationCode: payload.confirmationCode,
              scheduledAt: String(payload.scheduledAt ?? ''),
              doctorName: String(payload.doctorName ?? 'Your doctor'),
              visitType: String(payload.visitType ?? 'clinic'),
            };
            appointmentsUpdated = true;
          } else if (
            [
              'cancel_appointment',
              'cancel_all_appointments',
              'reschedule_appointment',
              'change_visit_type',
            ].includes(toolName)
          ) {
            appointmentsUpdated = true;
          }
        }
      }
    }

    const lastAi = [...messages]
      .reverse()
      .find((m) => m instanceof AIMessage) as AIMessage | undefined;

    const raw =
      typeof lastAi?.content === 'string'
        ? lastAi.content
        : Array.isArray(lastAi?.content)
          ? lastAi.content
              .map((c) =>
                typeof c === 'string'
                  ? c
                  : 'text' in c
                    ? String(c.text)
                    : '',
              )
              .join('')
          : 'No reply generated.';

    return {
      reply: this.stripThinkingTokens(raw.trim() || 'No reply generated.'),
      booking,
      appointmentsUpdated: appointmentsUpdated || undefined,
      agentActions: agentActions.length > 0 ? agentActions : undefined,
    };
  }

  private stripThinkingTokens(text: string): string {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^\s*\n/, '')
      .trim();
  }

  private isGroqToolUseFailed(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as {
      status?: number;
      error?: { error?: { code?: string } };
    };
    return err.status === 400 && err.error?.error?.code === 'tool_use_failed';
  }

  private recoverFromToolUseFailed(error: unknown): string | null {
    const err = error as {
      error?: { error?: { failed_generation?: string } };
    };
    const raw = err.error?.error?.failed_generation;
    if (typeof raw !== 'string' || !raw.trim()) return null;

    return this.stripThinkingTokens(
      raw
        .replace(
          /\[(book_appointment|cancel_appointment|cancel_all_appointments|reschedule_appointment|change_visit_type)\]/gi,
          '',
        )
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    );
  }
}
