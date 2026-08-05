import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import Groq from 'groq-sdk';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'groq-sdk/resources/chat/completions';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { user } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { AppointmentService } from '../appointment/appointment.service';
import {
  ChromaService,
  CHROMA_COLLECTION_CLINIC,
} from './chroma/chroma.service';
import { ClinicIndexerService } from './chroma/clinic-indexer.service';
import type {
  PatientAiChatDto,
  PatientAiChatResponse,
} from './dto/patient-ai-chat.dto';

// ─── Appointment management tools ─────────────────────────────────────────────

const APPOINTMENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description:
        'Book a NEW appointment. Use scheduledAt from CLINIC SCHEDULE context (after →). Only when patient explicitly wants to book.',
      parameters: {
        type: 'object',
        properties: {
          doctorId: { type: 'string', description: 'Doctor UUID from context' },
          scheduledAt: {
            type: 'string',
            description: 'ISO datetime from context, e.g. 2026-06-13T14:40:00+03:00',
          },
          visitType: { type: 'string', enum: ['clinic', 'virtual'] },
          reason: { type: 'string', description: 'Default: Cardiology follow-up' },
        },
        required: ['doctorId', 'scheduledAt', 'visitType', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_appointment',
      description:
        'Cancel ONE upcoming appointment by its confirmation code from MY UPCOMING APPOINTMENTS.',
      parameters: {
        type: 'object',
        properties: {
          confirmationCode: {
            type: 'string',
            description: 'e.g. ICV-3603',
          },
        },
        required: ['confirmationCode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_all_appointments',
      description:
        'Cancel ALL upcoming appointments for this patient. Use when patient says cancel all / الغي كل المواعيد.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_appointment',
      description:
        'Move an existing appointment to a new slot. Use confirmationCode + new scheduledAt from CLINIC SCHEDULE context.',
      parameters: {
        type: 'object',
        properties: {
          confirmationCode: { type: 'string', description: 'e.g. ICV-3603' },
          scheduledAt: {
            type: 'string',
            description: 'New ISO datetime from clinic schedule context',
          },
        },
        required: ['confirmationCode', 'scheduledAt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_visit_type',
      description:
        'Change visit type (clinic ↔ virtual) for an existing upcoming appointment.',
      parameters: {
        type: 'object',
        properties: {
          confirmationCode: { type: 'string' },
          visitType: { type: 'string', enum: ['clinic', 'virtual'] },
        },
        required: ['confirmationCode', 'visitType'],
      },
    },
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class PatientAiChatService {
  private readonly logger = new Logger(PatientAiChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly appointmentService: AppointmentService,
    private readonly chromaService: ChromaService,
    private readonly clinicIndexer: ClinicIndexerService,
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

    const todayStr = this.todayEgyptStr();
    const retrievalQuery = this.buildRetrievalQuery(dto.message, dto.history);

    const [patientName, myAppointmentsContext, liveClinicContext] =
      await Promise.all([
        this.getPatientName(userId),
        this.buildPatientAppointmentsContext(userId),
        this.buildClinicContext(),
      ]);

    let clinicContext = liveClinicContext;

    if (this.chromaService.isReady) {
      const queryEmbedding = await this.chromaService.embed(retrievalQuery);
      if (queryEmbedding) {
        const docs = await this.chromaService.queryDocuments(
          CHROMA_COLLECTION_CLINIC,
          queryEmbedding,
          8,
        );
        if (docs.length > 0) {
          clinicContext = [
            this.formatChromaClinicDocs(docs, todayStr),
            '',
            '--- Live clinic snapshot (authoritative) ---',
            liveClinicContext,
          ].join('\n');
        }
      }
      void this.clinicIndexer.indexPatientAppointments(userId);
    }

    const systemPrompt = this.buildSystemPrompt(
      patientName,
      todayStr,
      clinicContext,
      myAppointmentsContext,
    );

    const groq = new Groq({ apiKey });
    const primaryModel =
      process.env.GROQ_CHAT_MODEL?.trim() ||
      'meta-llama/llama-4-scout-17b-16e-instruct';
    const fallbackModel =
      process.env.GROQ_CHAT_FALLBACK_MODEL?.trim() || 'openai/gpt-oss-20b';

    const recentHistory = dto.history.slice(-6);

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(
        (h): ChatCompletionMessageParam => ({
          role: h.role,
          content: h.content,
        }),
      ),
      { role: 'user', content: dto.message },
    ];

    try {
      return await this.runWithTools(
        groq,
        primaryModel,
        messages,
        userId,
        true,
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;

      if (this.isGroqRateLimit(error) && fallbackModel !== primaryModel) {
        this.logger.warn(
          `Primary model rate-limited — retrying with ${fallbackModel}`,
        );
        try {
          return await this.runWithTools(
            groq,
            fallbackModel,
            messages,
            userId,
            true,
          );
        } catch (fallbackError) {
          if (this.isGroqRateLimit(fallbackError)) {
            return { reply: this.rateLimitReply(fallbackError) };
          }
          this.logger.error('Patient AI chat fallback failed', fallbackError);
        }
      }

      if (this.isGroqRateLimit(error)) {
        return { reply: this.rateLimitReply(error) };
      }

      this.logger.error('Patient AI chat failed', error);
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }
  }

  /** Combine recent conversation + latest message for semantic retrieval. */
  private buildRetrievalQuery(
    message: string,
    history: PatientAiChatDto['history'],
  ): string {
    const recent = history
      .slice(-4)
      .map((h) => `${h.role}: ${h.content}`)
      .join('\n');
    return recent ? `${recent}\nuser: ${message}` : message;
  }

  // ─── Format ChromaDB results into a context string ────────────────────────

  private formatChromaClinicDocs(
    docs: Array<{ id: string; document: string; metadata: Record<string, unknown>; distance: number }>,
    todayStr: string,
  ): string {
    if (docs.length === 0) {
      return `=== CLINIC SCHEDULE CONTEXT (live, as of ${todayStr}) ===\n[No relevant data retrieved — try rephrasing your question.]\n=== END CLINIC CONTEXT ===`;
    }

    const seen = new Set<string>();
    const uniqueDocs = docs.filter((d) => {
      if (seen.has(d.document)) return false;
      seen.add(d.document);
      return true;
    });

    return [
      `=== RELEVANT CLINIC INFO (as of ${todayStr}) ===`,
      ...uniqueDocs.map((d) => d.document),
      '=== END RELEVANT INFO ===',
    ].join('\n');
  }

  // ─── Agentic tool-calling loop ────────────────────────────────────────────

  private async runWithTools(
    groq: Groq,
    model: string,
    messages: ChatCompletionMessageParam[],
    userId: number,
    allowTools: boolean,
    maxIterations = 5,
  ): Promise<PatientAiChatResponse> {
    let booking: PatientAiChatResponse['booking'];
    let appointmentsUpdated = false;

    const isReasoningModel = /qwq|qwen3|gpt-oss|r1|deepseek-r1/i.test(model);
    const temperature = isReasoningModel ? 0.6 : 0.45;
    const maxTokens = isReasoningModel ? 2048 : 900;
    const tools = allowTools ? APPOINTMENT_TOOLS : undefined;

    for (let i = 0; i < maxIterations; i++) {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        ...(tools ? { tools, tool_choice: 'auto' as const } : {}),
        temperature,
        max_completion_tokens: maxTokens,
        stream: false,
      });

      const choice = completion.choices[0];
      if (!choice) break;

      const assistantMessage = choice.message;
      messages.push(assistantMessage as ChatCompletionMessageParam);

      if (
        choice.finish_reason === 'stop' ||
        !assistantMessage.tool_calls?.length
      ) {
        const raw = assistantMessage.content?.trim() || 'No reply generated.';
        return {
          reply: this.stripThinkingTokens(raw),
          booking,
          appointmentsUpdated: appointmentsUpdated || undefined,
        };
      }

      for (const toolCall of assistantMessage.tool_calls) {
        const result = await this.executeTool(
          toolCall.function.name,
          toolCall.function.arguments,
          userId,
        );
        if (result.booking) booking = result.booking;
        if (result.appointmentsUpdated) appointmentsUpdated = true;
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result.data),
        });
      }
    }

    return {
      reply: 'I was unable to complete this request. Please try again.',
      booking,
      appointmentsUpdated: appointmentsUpdated || undefined,
    };
  }

  /**
   * Strip <think>...</think> blocks produced by reasoning models (QwQ, DeepSeek-R1).
   * Groq may return them inline in the content field.
   */
  private stripThinkingTokens(text: string): string {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^\s*\n/, '')
      .trim();
  }

  // ─── Tool executor ────────────────────────────────────────────────────────

  private async executeTool(
    name: string,
    argsJson: string,
    userId: number,
  ): Promise<{
    data: unknown;
    booking?: PatientAiChatResponse['booking'];
    appointmentsUpdated?: boolean;
  }> {
    let args: Record<string, string> = {};
    try {
      args = JSON.parse(argsJson) as Record<string, string>;
    } catch {
      return { data: { error: 'Invalid arguments' } };
    }

    try {
      if (name === 'book_appointment') {
        const { doctorId, scheduledAt, visitType, reason } = args;
        if (!doctorId || !scheduledAt || !visitType || !reason) {
          return { data: { error: 'Missing required booking fields' } };
        }
        if (visitType !== 'clinic' && visitType !== 'virtual') {
          return { data: { error: 'visitType must be clinic or virtual' } };
        }
        const created = await this.appointmentService.create(userId, {
          doctorId,
          scheduledAt,
          visitType: visitType as 'clinic' | 'virtual',
          reason: reason.slice(0, 1500),
        });
        const doctors = await this.appointmentService.listDoctors();
        const doc = doctors.find((d) => d.id === doctorId);
        const bookingResult = {
          confirmationCode: created.confirmationCode,
          scheduledAt: created.scheduledAt,
          doctorName: doc?.name ?? 'Your doctor',
          visitType: created.visitType,
        };
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            ...bookingResult,
            message: `Booked ${bookingResult.confirmationCode}`,
          },
          booking: bookingResult,
          appointmentsUpdated: true,
        };
      }

      if (name === 'cancel_appointment') {
        const code = args.confirmationCode?.trim();
        if (!code) return { data: { error: 'confirmationCode required' } };
        const appt = await this.appointmentService.findUpcomingByConfirmationCode(
          userId,
          code,
        );
        const result = await this.appointmentService.cancel(userId, appt.id);
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: result.confirmationCode,
            message: `Cancelled ${result.confirmationCode}`,
          },
          appointmentsUpdated: true,
        };
      }

      if (name === 'cancel_all_appointments') {
        const result = await this.appointmentService.cancelAllUpcoming(userId);
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            cancelledCount: result.cancelledCount,
            confirmationCodes: result.confirmationCodes,
            message:
              result.cancelledCount === 0
                ? 'No upcoming appointments to cancel'
                : `Cancelled ${result.cancelledCount} appointment(s)`,
          },
          appointmentsUpdated: result.cancelledCount > 0,
        };
      }

      if (name === 'reschedule_appointment') {
        const code = args.confirmationCode?.trim();
        const scheduledAt = args.scheduledAt?.trim();
        if (!code || !scheduledAt) {
          return { data: { error: 'confirmationCode and scheduledAt required' } };
        }
        const updated = await this.appointmentService.rescheduleByConfirmationCode(
          userId,
          code,
          scheduledAt,
        );
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: updated.confirmationCode,
            scheduledAt: updated.scheduledAt,
            message: `Rescheduled ${updated.confirmationCode} to ${updated.scheduledAt}`,
          },
          appointmentsUpdated: true,
        };
      }

      if (name === 'change_visit_type') {
        const code = args.confirmationCode?.trim();
        const visitType = args.visitType?.trim();
        if (!code || !visitType) {
          return { data: { error: 'confirmationCode and visitType required' } };
        }
        if (visitType !== 'clinic' && visitType !== 'virtual') {
          return { data: { error: 'visitType must be clinic or virtual' } };
        }
        const updated =
          await this.appointmentService.changeVisitTypeByConfirmationCode(
            userId,
            code,
            visitType as 'clinic' | 'virtual',
          );
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: updated.confirmationCode,
            visitType: updated.visitType,
            message: `${updated.confirmationCode} is now ${updated.visitType}`,
          },
          appointmentsUpdated: true,
        };
      }

      return { data: { error: `Unknown tool: ${name}` } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Action failed';
      return { data: { error: msg } };
    }
  }

  private refreshAppointmentIndex(userId: number): void {
    void this.clinicIndexer.indexPatientAppointments(userId);
    void this.clinicIndexer.indexDoctorsAndSchedules();
  }

  // ─── RAG / Context builders ───────────────────────────────────────────────

  /**
   * Live clinic data from DB — doctors, specialties, and available slots.
   */
  private async buildClinicContext(): Promise<string> {
    const today = this.todayEgyptStr();
    let doctors: Awaited<ReturnType<AppointmentService['listDoctors']>> = [];
    try {
      doctors = await this.appointmentService.listDoctors();
    } catch {
      return '=== CLINIC CONTEXT: unavailable ===';
    }

    const lines: string[] = [
      `=== CLINIC SCHEDULE (as of ${today}, next 7 days) ===`,
      'scheduledAt values after → are pre-computed ISO strings — use them exactly for booking.',
      '',
    ];

    for (const doc of doctors) {
      lines.push(`${doc.name} | ${doc.title} | id:${doc.id}`);

      try {
        const avail = await this.appointmentService.getDoctorAvailability(
          doc.id,
          today,
          3,
        );

        const blocked = avail.days
          .filter((d) => d.disabled)
          .map((d) => d.fullDate)
          .join(', ');
        if (blocked) lines.push(`  Blocked: ${blocked}`);

        let daysShown = 0;
        for (const day of avail.days.filter((d) => !d.disabled)) {
          if (daysShown >= 3) break;
          const rawSlots = avail.timeSlotsByDate[day.fullDate] ?? [];
          const free = rawSlots
            .filter((s) => s.available)
            .slice(0, 3)
            .map((s) => `${s.time}→${this.slotToIso(day.fullDate, s.time)}`);
          if (free.length > 0) {
            lines.push(`  ${day.fullDate}(${day.day}): ${free.join(' | ')}`);
            daysShown++;
          }
        }
        if (daysShown === 0 && !blocked) lines.push('  [No slots in 7 days]');
      } catch {
        lines.push('  [unavailable]');
      }
      lines.push('');
    }

    lines.push('=== END CLINIC SCHEDULE ===');
    return lines.join('\n');
  }

  /**
   * Build the patient's own upcoming appointments as context so the AI can
   * answer "what are my appointments?" questions.
   */
  private async buildPatientAppointmentsContext(
    userId: number,
  ): Promise<string> {
    try {
      const appts = await this.appointmentService.listPatientAppointments(userId);
      const upcoming = appts.filter(
        (a) =>
          a.status !== 'cancelled' &&
          new Date(a.scheduledAt) >= new Date(),
      );
      if (upcoming.length === 0) {
        return '=== MY UPCOMING APPOINTMENTS ===\n(none)\nUse confirmationCode in cancel/reschedule tools.\n=== END ===';
      }
      const lines = [
        '=== MY UPCOMING APPOINTMENTS ===',
        'Format: confirmationCode | scheduledAt | doctor | visitType | status',
        'Use confirmationCode (e.g. ICV-3603) in cancel_appointment / reschedule_appointment / change_visit_type.',
      ];
      for (const a of upcoming.slice(0, 8)) {
        lines.push(
          `  ${a.confirmationCode} | ${a.scheduledAt} | ${a.clinician} | ${a.visitType} | ${a.status}`,
        );
      }
      lines.push('=== END MY APPOINTMENTS ===');
      return lines.join('\n');
    } catch {
      return '';
    }
  }

  // ─── System prompt ────────────────────────────────────────────────────────

  private buildSystemPrompt(
    patientName: string,
    todayStr: string,
    clinicContext: string,
    myAppointmentsContext: string,
  ): string {
    return `You are ICARE Health Advisor — a thoughtful assistant for patient "${patientName}".
Today: ${todayStr} (Cairo, UTC+3).

## How to behave
- First understand what the patient really wants from their message AND the conversation history.
- Think in Arabic or English the same way the patient speaks (Egyptian dialect is fine).
- Answer naturally like a helpful clinic coordinator — not like a template or a form.
- Never invent doctors, dates, or appointment codes. Use ONLY the clinic data below.
- Never use placeholder brackets like [اسم الطبيب] or [Doctor Name].
- If information is missing, say so honestly and ask a short clarifying question.
- For health questions outside appointments, give concise, safe general guidance.

## Patient's upcoming appointments
${myAppointmentsContext}

## Clinic knowledge (live + semantically retrieved)
${clinicContext}

## Appointment actions (use tools only when the patient clearly wants an action)
You CAN book, cancel, reschedule, and change visit type via tools.
- Read the patient's intent from context — do not rely on exact keywords.
- For booking/reschedule: use scheduledAt values exactly as shown (after →).
- For cancel/reschedule/visit-type change: use confirmationCode from the patient's appointments.
- If the patient is only asking a question (who, when, what), answer from the data above — no tool call.
- After a tool succeeds, confirm clearly what changed.`;
  }

  private isGroqRateLimit(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const err = error as { status?: number; error?: { error?: { code?: string } } };
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

  private todayEgyptStr(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  /**
   * Convert "YYYY-MM-DD" + "09:00 AM" (12-hour) → ISO 8601 with Cairo offset.
   */
  private slotToIso(dateStr: string, time12h: string): string {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time12h.trim());
    if (!match) return `${dateStr}T00:00:00+03:00`;
    let hours = parseInt(match[1]!, 10);
    const minutes = parseInt(match[2]!, 10);
    const period = match[3]!.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${dateStr}T${hh}:${mm}:00+03:00`;
  }
}
