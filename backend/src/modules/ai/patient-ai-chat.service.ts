import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { user } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { todayClinicDateStr } from '../../common/clinic-time.util';
import { ChromaService } from './chroma/chroma.service';
import { ClinicIndexerService } from './chroma/clinic-indexer.service';
import { LangChainCareAgentService } from './patient-agent/langchain/langchain-care-agent.service';
import { LangChainRagPipelineService } from './patient-agent/langchain/langchain-rag-pipeline.service';
import type {
  PatientAiChatDto,
  PatientAiChatResponse,
  PatientAgentPipelineStage,
} from './dto/patient-ai-chat.dto';

@Injectable()
export class PatientAiChatService {
  private readonly logger = new Logger(PatientAiChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly chromaService: ChromaService,
    private readonly clinicIndexer: ClinicIndexerService,
    private readonly ragPipeline: LangChainRagPipelineService,
    private readonly careAgent: LangChainCareAgentService,
  ) {}

  async chat(
    userId: number,
    dto: PatientAiChatDto,
  ): Promise<PatientAiChatResponse> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI service unavailable — GROQ_API_KEY not configured',
      );
    }

    const todayStr = todayClinicDateStr();
    const patientName = await this.getPatientName(userId);

    const pipeline = await this.ragPipeline.run(apiKey, {
      message: dto.message,
      history: dto.history,
      todayStr,
      patientName,
      userId,
    });

    if (this.chromaService.isSearchEnabled) {
      void this.clinicIndexer.indexPatientAppointments(userId);
    }

    const clinicContext = [
      pipeline.assembled.formatted,
      '',
      '--- Live clinic snapshot (authoritative) ---',
      pipeline.fallbackLiveContext.clinic,
    ].join('\n');

    const systemPrompt = this.buildSystemPrompt(
      patientName,
      todayStr,
      clinicContext,
      pipeline.fallbackLiveContext.appointments,
      pipeline.fallbackLiveContext.patientContext,
      pipeline.intentPromptAddon,
    );

    const pipelineTrace: PatientAgentPipelineStage[] = pipeline.pipelineTrace;
    const primaryModel =
      process.env.GROQ_CHAT_MODEL?.trim() ||
      'meta-llama/llama-4-scout-17b-16e-instruct';
    const fallbackModel =
      process.env.GROQ_CHAT_FALLBACK_MODEL?.trim() || 'openai/gpt-oss-20b';

    try {
      const result = await this.careAgent.invoke({
        apiKey,
        model: primaryModel,
        systemPrompt,
        message: dto.message,
        history: dto.history.slice(-6),
        userId,
      });
      return { ...result, pipelineTrace };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;

      if (this.isGroqRateLimit(error) && fallbackModel !== primaryModel) {
        this.logger.warn(
          `Primary model rate-limited — retrying with ${fallbackModel}`,
        );
        try {
          const result = await this.careAgent.invoke({
            apiKey,
            model: fallbackModel,
            systemPrompt,
            message: dto.message,
            history: dto.history.slice(-6),
            userId,
          });
          return { ...result, pipelineTrace };
        } catch (fallbackError) {
          if (this.isGroqRateLimit(fallbackError)) {
            return { reply: this.rateLimitReply(fallbackError), pipelineTrace };
          }
          this.logger.error('Patient AI chat fallback failed', fallbackError);
        }
      }

      if (this.isGroqRateLimit(error)) {
        return { reply: this.rateLimitReply(error), pipelineTrace };
      }

      this.logger.error('Patient AI chat failed', error);
      throw new ServiceUnavailableException(
        'AI service temporarily unavailable',
      );
    }
  }

  private buildSystemPrompt(
    patientName: string,
    todayStr: string,
    clinicContext: string,
    myAppointmentsContext: string,
    patientMedicalContext: string,
    intentPromptAddon: string,
  ): string {
    return `You are ICARE Care Agent — an autonomous clinic coordinator for patient "${patientName}".
Today: ${todayStr} (Cairo, UTC+3).

${intentPromptAddon}

## Agent identity
- You are a LangChain ReAct agent with clinic tools.
- Capabilities: book, cancel (one or all), reschedule, change visit type, answer care questions from live data.
- Speak naturally in Arabic or English — match the patient's language (Egyptian dialect is fine).
- Never invent doctors, dates, or appointment codes. Use ONLY the clinic data below.
- You have full access to this patient's medical record below — use it to give accurate, personalised answers.
- NEVER reveal or reference data from any other patient. All data below belongs exclusively to "${patientName}".

## Patient's upcoming appointments
${myAppointmentsContext}

${patientMedicalContext}

## Clinic knowledge (live)
${clinicContext}

## Tool-calling rules (critical)
- Use LangChain tools only — never write [tool_name] in text.
- cancel_all_appointments: ask confirmation first; call tool only after أيوه / نعم / أكد / yes.
- book_appointment: call only after patient agrees to a specific slot.
- Appointment times in Cairo local time only.`;
  }

  private isGroqRateLimit(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as {
      status?: number;
      error?: { error?: { code?: string } };
    };
    return (
      err.status === 429 ||
      err.status === 413 ||
      err.error?.error?.code === 'rate_limit_exceeded'
    );
  }

  private rateLimitReply(error: unknown): string {
    const msg =
      error && typeof error === 'object' && 'error' in error
        ? JSON.stringify((error as { error?: unknown }).error)
        : '';
    const retryMatch = /try again in ([\d]+m[\d.]*s)/i.exec(msg);
    const wait = retryMatch?.[1] ?? 'a few minutes';

    return `عذراً، خدمة الذكاء الاصطناعي وصلت للحد اليومي مؤقتاً. حاول مرة أخرى بعد ${wait}.\n\nSorry — the AI service hit its daily limit. Please try again in ${wait}.`;
  }

  private async getPatientName(userId: number): Promise<string> {
    try {
      const userRow = await this.db.query.user.findFirst({
        where: eq(user.id, userId),
      });
      return userRow?.name ?? 'Patient';
    } catch {
      return 'Patient';
    }
  }
}
