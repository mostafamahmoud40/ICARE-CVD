import { Injectable, Logger } from '@nestjs/common';
import { createAgent } from 'langchain';
import { ChatGroq } from '@langchain/groq';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';

import type { DoctorAiChatResponse } from '../../dto/doctor-ai-chat.dto';
import type { DoctorPipelineResult } from '../doctor.types';
import { buildDoctorLangChainTools } from './doctor.langchain-tools';
import { DoctorToolsService } from './doctor-tools.service';

export type DoctorAgentInput = {
  apiKey: string;
  model: string;
  /** Core system prompt (identity + roster + tool rules). */
  systemPrompt: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Doctor UUID from the `doctor` table — used to scope every tool call. */
  doctorId: string;
  /** Optional: RAG pipeline result to enrich the system prompt. */
  pipeline?: DoctorPipelineResult;
};

@Injectable()
export class LangChainDoctorAgentService {
  private readonly logger = new Logger(LangChainDoctorAgentService.name);

  constructor(private readonly doctorToolsService: DoctorToolsService) {}

  async invoke(input: DoctorAgentInput): Promise<DoctorAiChatResponse> {
    const tools = buildDoctorLangChainTools(
      this.doctorToolsService,
      input.doctorId,
    );

    const isReasoningModel = /qwq|qwen3|gpt-oss|r1|deepseek-r1/i.test(
      input.model,
    );

    const llm = new ChatGroq({
      apiKey: input.apiKey,
      model: input.model,
      temperature: isReasoningModel ? 0.6 : 0.4,
      maxTokens: isReasoningModel ? 2048 : 1400,
    });

    // Merge system prompt with pipeline intent addon (if available)
    const enrichedSystemPrompt = input.pipeline?.intentPromptAddon
      ? `${input.systemPrompt}\n\n${input.pipeline.intentPromptAddon}`
      : input.systemPrompt;

    const agent = createAgent({
      model: llm,
      tools,
      systemPrompt: enrichedSystemPrompt,
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
      return this.parseResult(result.messages as BaseMessage[]);
    } catch (error) {
      if (this.isGroqToolUseFailed(error)) {
        const recovered = this.recoverFromToolUseFailed(error);
        if (recovered) {
          this.logger.warn(
            'Doctor agent tool_use_failed — returning text fallback',
          );
          return { reply: recovered };
        }
      }
      throw error;
    }
  }

  private parseResult(messages: BaseMessage[]): DoctorAiChatResponse {
    const toolCallNameById = new Map<string, string>();

    for (const msg of messages) {
      if (msg instanceof AIMessage && msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          if (tc.id && tc.name) toolCallNameById.set(tc.id, tc.name);
        }
      }
    }

    for (const msg of messages) {
      if (msg instanceof ToolMessage) {
        const name = toolCallNameById.get(msg.tool_call_id) ?? 'tool';
        this.logger.debug(`Doctor agent called tool: ${name}`);
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
                typeof c === 'string' ? c : 'text' in c ? String(c.text) : '',
              )
              .join('')
          : 'No reply generated.';

    return {
      reply: this.stripThinkingTokens(raw.trim() || 'No reply generated.'),
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
          /\[(list_patients|get_patient_overview|get_patient_consultations|get_patient_medications|get_patient_vitals|get_patient_lab_results|get_patient_clinical_notes|get_patient_procedures|get_patient_ai_analyses|get_patient_diagnoses)\]/gi,
          '',
        )
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    );
  }
}
