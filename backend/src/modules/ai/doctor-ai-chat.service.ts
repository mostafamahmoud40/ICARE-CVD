import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { doctor, user } from '../../database/schema';
import { todayClinicDateStr } from '../../common/clinic-time.util';
import type {
  DoctorAiChatDto,
  DoctorAiChatResponse,
} from './dto/doctor-ai-chat.dto';
import { DoctorToolsService } from './doctor-agent/langchain/doctor-tools.service';
import { LangChainDoctorAgentService } from './doctor-agent/langchain/langchain-doctor-agent.service';
import { DoctorRagPipelineService } from './doctor-agent/langchain/doctor-rag-pipeline.service';
import type { DoctorPipelineResult } from './doctor-agent/doctor.types';

@Injectable()
export class DoctorAiChatService {
  private readonly logger = new Logger(DoctorAiChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorTools: DoctorToolsService,
    private readonly agentService: LangChainDoctorAgentService,
    private readonly pipeline: DoctorRagPipelineService,
  ) {}

  async chat(
    doctorUserId: number,
    dto: DoctorAiChatDto,
  ): Promise<DoctorAiChatResponse> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI service unavailable — GROQ_API_KEY not configured',
      );
    }

    // Resolve doctor row
    const doctorRow = await this.db
      .select({ id: doctor.id, name: user.name, specialty: doctor.specialty })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.userId, doctorUserId))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!doctorRow) {
      throw new ServiceUnavailableException('Doctor profile not found');
    }

    const todayStr = todayClinicDateStr();
    const history = dto.history.slice(-10);

    // ── Run the full RAG pipeline ──────────────────────────────────────────
    let pipelineResult: DoctorPipelineResult | undefined;
    try {
      pipelineResult = await this.pipeline.run(apiKey, {
        message: dto.message,
        history,
        todayStr,
        doctorId: doctorRow.id,
        doctorUserId,
      });

      this.logger.debug(
        `Doctor pipeline trace:\n${pipelineResult.pipelineTrace.map((s) => `  [${s.stage}] ${s.label}: ${s.summary}`).join('\n')}`,
      );
    } catch (pipelineError) {
      this.logger.warn(
        `Doctor pipeline failed — falling back to basic agent: ${String(pipelineError)}`,
      );
    }

    // Roster comes from pipeline or we fetch it fresh
    const roster =
      pipelineResult?.roster ??
      (await this.doctorTools.listPatients(doctorRow.id));

    const systemPrompt = this.buildSystemPrompt(
      doctorRow.name,
      doctorRow.specialty,
      todayStr,
      roster,
    );

    const primaryModel =
      process.env.GROQ_CHAT_MODEL?.trim() ||
      'meta-llama/llama-4-scout-17b-16e-instruct';
    const fallbackModel =
      process.env.GROQ_CHAT_FALLBACK_MODEL?.trim() || 'openai/gpt-oss-20b';

    const agentInput = {
      apiKey,
      model: primaryModel,
      systemPrompt,
      message: dto.message,
      history,
      doctorId: doctorRow.id,
      pipeline: pipelineResult,
    };

    try {
      return await this.agentService.invoke(agentInput);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;

      if (this.isGroqRateLimit(error) && fallbackModel !== primaryModel) {
        this.logger.warn(
          `Doctor agent rate-limited — retrying with ${fallbackModel}`,
        );
        try {
          return await this.agentService.invoke({
            ...agentInput,
            model: fallbackModel,
          });
        } catch (fallbackError) {
          if (this.isGroqRateLimit(fallbackError)) {
            return { reply: this.rateLimitReply(fallbackError) };
          }
          this.logger.error('Doctor agent fallback failed', fallbackError);
        }
      }

      if (this.isGroqRateLimit(error)) {
        return { reply: this.rateLimitReply(error) };
      }

      this.logger.error('Doctor AI chat failed', error);
      throw new ServiceUnavailableException(
        'AI service temporarily unavailable',
      );
    }
  }

  private buildSystemPrompt(
    doctorName: string,
    specialty: string | null,
    todayStr: string,
    roster: string,
  ): string {
    return `You are ICARE Doctor Assistant — an autonomous clinical AI companion for Dr. ${doctorName}${specialty ? ' (' + specialty + ')' : ''}.
Today: ${todayStr} (Cairo, UTC+3).

## Identity & capabilities
- You are a LangChain ReAct agent with 11 read-only clinical tools.
- You retrieve data on-demand via tools: patient list, profiles, consultations, medications, vitals, lab results, clinical notes, procedures, AI analyses (Echo/ECG/X-ray/Cine-MRI), diagnoses, and patient search.
- You are READ-ONLY. You do NOT book, cancel, prescribe, or modify anything.
- Use tools to fetch data before answering. Call multiple tools in sequence if needed.
- Speak naturally in Arabic or English — match the doctor's language (Egyptian dialect is fine).
- Be concise and clinically precise.

## Disambiguation & clarification rules (CRITICAL)
These rules govern how you handle ambiguous requests:

### When multiple patients match
1. Call the relevant tool (e.g. search_patients, list_patients, get_patient_procedures).
2. If the result contains MORE THAN ONE patient, DO NOT pick one arbitrarily.
3. Present ALL matching patients clearly and ask the doctor to choose:
   "وجدت أكتر من مريض — مين تقصد؟\n{list each: PatientNumber | Name | relevant detail}"
4. Wait for the doctor's clarification before fetching full details.

### When the intent is unclear
1. If the question is ambiguous (e.g. "إيه أخبار المريض؟" without specifying which one), ask ONE focused clarifying question.
2. Do NOT call any tool before getting clarification.
3. Ask in the same language the doctor used.

### When intent is clear and unique
1. Proceed directly — call the appropriate tools and answer.
2. Do NOT ask for clarification when the question is clear.

### Examples
- "مين عنده عملية بكرا؟" → call search_patients("procedures tomorrow") → if multiple: present list → ask which one
- "عمل ايه عند أحمد؟" + only ONE patient named Ahmad → proceed directly
- "عمل ايه عند أحمد؟" + multiple patients named Ahmad → present all + ask

## Tool-calling rules
- For group queries ("مين عنده...") → use search_patients first.
- For specific patients → use get_patient_* tools.
- NEVER fabricate data. Say "not recorded" if data is missing.
- For AI analyses: present as AI-generated, recommend clinical correlation.
- NEVER access patients outside Dr. ${doctorName}'s panel.

## Your accessible patients
${roster}`;
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
}
