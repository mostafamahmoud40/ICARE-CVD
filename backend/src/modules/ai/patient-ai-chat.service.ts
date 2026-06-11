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
import { patient, user } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { AppointmentService } from '../appointment/appointment.service';
import type {
  PatientAiChatDto,
  PatientAiChatResponse,
} from './dto/patient-ai-chat.dto';

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_doctors',
      description:
        'List all available doctors the patient can book an appointment with. Call this when the patient asks about doctors or wants to book without specifying one.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description:
        'Get available appointment slots for a doctor. Can show a single day or a multi-day schedule. Use days=7 when the patient asks for the weekly schedule or "all available days".',
      parameters: {
        type: 'object',
        properties: {
          doctorId: {
            type: 'string',
            description: 'The UUID of the doctor',
          },
          date: {
            type: 'string',
            description:
              'Start date in YYYY-MM-DD format. Defaults to today if omitted.',
          },
          days: {
            type: 'number',
            description:
              'Number of days to fetch slots for (1–14). Use 7 for a weekly view. Defaults to 1.',
          },
        },
        required: ['doctorId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description:
        'Book an appointment for the patient with a doctor. Use this when the patient confirms they want to book a specific slot.',
      parameters: {
        type: 'object',
        properties: {
          doctorId: {
            type: 'string',
            description: 'UUID of the doctor',
          },
          scheduledAt: {
            type: 'string',
            description:
              'ISO 8601 datetime string for the appointment (e.g. 2026-06-11T10:30:00+03:00)',
          },
          visitType: {
            type: 'string',
            enum: ['clinic', 'virtual'],
            description: 'Whether the visit is in-clinic or virtual',
          },
          reason: {
            type: 'string',
            description: 'Brief reason for the appointment (max 200 chars)',
          },
        },
        required: ['doctorId', 'scheduledAt', 'visitType', 'reason'],
      },
    },
  },
];

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class PatientAiChatService {
  private readonly logger = new Logger(PatientAiChatService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly appointmentService: AppointmentService,
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

    const patientName = await this.getPatientName(userId);
    const todayStr = this.todayEgyptStr();
    const systemPrompt = this.buildSystemPrompt(patientName, todayStr);

    const groq = new Groq({ apiKey });
    // llama-3.3-70b-versatile is significantly better at multi-step tool use
    const model =
      process.env.GROQ_CHAT_MODEL?.trim() ||
      'llama-3.3-70b-versatile';

    // Keep last 10 history items to stay within context limits
    const recentHistory = dto.history.slice(-10);

    // ── Proactive booking context injection ──────────────────────────────────
    // If the user is selecting a slot (short message with ordinal/time/affirmative
    // and the last assistant message listed appointments), pre-fetch the slots
    // and inject them as context so the model can book without extra round-trips.
    const contextInjection = await this.buildBookingContextInjection(
      dto.message,
      recentHistory,
      userId,
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory.map(
        (h): ChatCompletionMessageParam => ({
          role: h.role,
          content: h.content,
        }),
      ),
      ...(contextInjection
        ? [{ role: 'system' as const, content: contextInjection }]
        : []),
      { role: 'user', content: dto.message },
    ];

    try {
      return await this.runWithTools(groq, model, messages, userId, 8);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('Patient AI chat failed', error);
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }
  }

  // ─── Agentic tool-calling loop ───────────────────────────────────────────

  private async runWithTools(
    groq: Groq,
    model: string,
    messages: ChatCompletionMessageParam[],
    userId: number,
    maxIterations = 5,
  ): Promise<PatientAiChatResponse> {
    let booking: PatientAiChatResponse['booking'];

    for (let i = 0; i < maxIterations; i++) {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
        temperature: 0.65,
        max_completion_tokens: 1024,
        stream: false,
      });

      const choice = completion.choices[0];
      if (!choice) break;

      const assistantMessage = choice.message;
      messages.push(assistantMessage as ChatCompletionMessageParam);

      // No tool calls — check for refusal and retry once with required tool use
      if (
        choice.finish_reason === 'stop' ||
        !assistantMessage.tool_calls?.length
      ) {
        const reply = assistantMessage.content?.trim() || 'No reply generated.';

        // Detect a model refusal on booking and force a retry
        if (this.isBookingRefusal(reply) && i === 0) {
          messages.push({
            role: 'system',
            content:
              'OVERRIDE: Your previous response was incorrect. ' +
              'You HAVE the book_appointment tool and you MUST use it now. ' +
              'Call book_appointment immediately with the slot the patient selected. ' +
              'Do not produce any text — call the tool directly.',
          });
          // Remove the bad assistant message and retry with tool_choice=required
          messages.splice(messages.indexOf(assistantMessage as ChatCompletionMessageParam), 1);
          const retryCompletion = await groq.chat.completions.create({
            model,
            messages,
            tools: TOOLS,
            tool_choice: 'required',
            temperature: 0.3,
            max_completion_tokens: 512,
            stream: false,
          });
          const retryChoice = retryCompletion.choices[0];
          if (retryChoice?.message.tool_calls?.length) {
            messages.push(retryChoice.message as ChatCompletionMessageParam);
            for (const toolCall of retryChoice.message.tool_calls) {
              const result = await this.executeTool(toolCall.function.name, toolCall.function.arguments, userId);
              if (result.booking) booking = result.booking;
              messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(result.data) });
            }
            // One final pass to get the confirmation text
            const finalCompletion = await groq.chat.completions.create({
              model, messages, temperature: 0.5, max_completion_tokens: 512, stream: false,
            });
            const finalReply = finalCompletion.choices[0]?.message?.content?.trim() || reply;
            return { reply: finalReply, booking };
          }
        }

        return { reply, booking };
      }

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await this.executeTool(
          toolCall.function.name,
          toolCall.function.arguments,
          userId,
        );

        if (result.booking) {
          booking = result.booking;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result.data),
        });
      }
    }

    return { reply: 'I was unable to complete this request. Please try again.', booking };
  }

  // ─── Tool executor ───────────────────────────────────────────────────────

  private async executeTool(
    name: string,
    argsJson: string,
    userId: number,
  ): Promise<{ data: unknown; booking?: PatientAiChatResponse['booking'] }> {
    let args: Record<string, string> = {};
    try {
      args = JSON.parse(argsJson) as Record<string, string>;
    } catch {
      return { data: { error: 'Invalid arguments' } };
    }

    switch (name) {
      case 'list_doctors': {
        const doctors = await this.appointmentService.listDoctors();
        return { data: doctors };
      }

      case 'get_available_slots': {
        const { doctorId, date } = args;
        const requestedDays = Math.min(
          14,
          Math.max(1, parseInt(String((args as Record<string, unknown>)['days'] ?? '1'), 10) || 1),
        );
        if (!doctorId) {
          return { data: { error: 'doctorId is required' } };
        }
        try {
          const startDate = date ?? this.todayEgyptStr();
          const availability = await this.appointmentService.getDoctorAvailability(
            doctorId,
            startDate,
            requestedDays,
          );
          const doctorList = await this.appointmentService.listDoctors();
          const doc = doctorList.find((d) => d.id === doctorId);

          // Build a per-day map with pre-computed ISO scheduledAt values
          const scheduleByDate: Record<
            string,
            Array<{ label: string; scheduledAt: string }>
          > = {};

          for (const day of availability.days) {
            const rawSlots = availability.timeSlotsByDate[day.fullDate] ?? [];
            const available = rawSlots
              .filter((s) => s.available)
              .map((s) => ({
                label: s.time,
                scheduledAt: this.slotToIso(day.fullDate, s.time),
              }));
            if (!day.disabled && (available.length > 0 || rawSlots.length > 0)) {
              scheduleByDate[day.fullDate] = available;
            }
          }

          const totalAvailableDays = Object.values(scheduleByDate).filter(
            (s) => s.length > 0,
          ).length;

          return {
            data: {
              doctorId,
              doctorName: doc?.name ?? 'Unknown doctor',
              startDate,
              days: requestedDays,
              scheduleByDate,
              totalAvailableDays,
              instruction:
                totalAvailableDays === 0
                  ? `No available slots in the next ${requestedDays} day(s) starting ${startDate}. The doctor may not have a schedule configured yet.`
                  : `Use the scheduledAt field from the chosen slot directly when calling book_appointment.`,
            },
          };
        } catch {
          return { data: { error: `Could not retrieve availability for doctor ${doctorId}` } };
        }
      }

      case 'book_appointment': {
        const { doctorId, scheduledAt, visitType, reason } = args;
        if (!doctorId || !scheduledAt || !visitType || !reason) {
          return { data: { error: 'Missing required booking fields' } };
        }
        if (visitType !== 'clinic' && visitType !== 'virtual') {
          return { data: { error: 'visitType must be clinic or virtual' } };
        }
        try {
          const created = await this.appointmentService.create(userId, {
            doctorId,
            scheduledAt,
            visitType: visitType as 'clinic' | 'virtual',
            reason: reason.slice(0, 1500),
          });

          const doctorList = await this.appointmentService.listDoctors();
          const doc = doctorList.find((d) => d.id === doctorId);

          const bookingResult = {
            confirmationCode: created.confirmationCode,
            scheduledAt: created.scheduledAt,
            doctorName: doc?.name ?? 'Your doctor',
            visitType: created.visitType,
          };

          return {
            data: {
              success: true,
              confirmationCode: bookingResult.confirmationCode,
              scheduledAt: bookingResult.scheduledAt,
              doctorName: bookingResult.doctorName,
              visitType: bookingResult.visitType,
              message: `Appointment booked successfully! Confirmation code: ${bookingResult.confirmationCode}`,
            },
            booking: bookingResult,
          };
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Booking failed';
          return { data: { error: msg } };
        }
      }

      default:
        return { data: { error: `Unknown tool: ${name}` } };
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildSystemPrompt(patientName: string, todayStr: string): string {
    return [
      `You are ICARE Health Advisor, a personal AI assistant for the patient named ${patientName}.`,
      `Today's date is ${todayStr}.`,
      '',
      '## Tools available',
      '  1. list_doctors — returns a list of doctors with their IDs, names, and specialties.',
      '  2. get_available_slots(doctorId, date?, days?) — returns available slots. Use days=7 for a weekly view or when the patient asks for "the schedule" / "all days". Returns a scheduleByDate map keyed by date.',
      '  3. book_appointment(doctorId, scheduledAt, visitType, reason) — books an appointment and returns a confirmation code.',
      '',
      '## CRITICAL rules — follow these exactly',
      '',
      '### IDs and UUIDs',
      '- NEVER show a doctor ID / UUID to the patient. IDs are internal; use them silently in tool calls only.',
      '- When you need a doctorId for a tool call, obtain it from a list_doctors tool result. Do NOT ask the patient for it.',
      '',
      '### Conversation continuity',
      '- The full conversation history is provided. Use it to remember which doctor was discussed and what was already agreed.',
      '- If the patient says "yes", "اه", "نعم", "okay", "proceed", or any similar confirmation, treat it as confirmation of the LAST thing you proposed and act on it immediately — do NOT ask again.',
      '- Do not re-list doctors or re-ask questions you already asked in the same conversation.',
      '',
      '### Appointment workflow — complete it in ONE round',
      'When the patient asks about a doctor\'s schedule or wants to book:',
      '  Step 1 → call list_doctors (only if you don\'t already have the doctorId from this conversation).',
      '  Step 2 → call get_available_slots:',
      '    - Use days=7 when the patient says "جدول", "schedule", "all days", "this week", "الأيام المتاحة".',
      '    - Use days=1 (or omit) when they ask about a specific date or "today".',
      '  Step 3 → present the result clearly: list each date that has slots, and the times under it.',
      '  Step 4 → when the patient picks a slot, call book_appointment right away using the exact scheduledAt from the tool result.',
      'Complete as many steps as possible in a single response without asking intermediate confirmation questions.',
      'IMPORTANT: If scheduleByDate has no available slots, tell the patient clearly and suggest trying another date range.',
      '',
      '### Booking — you CAN and MUST do this',
      '- You have FULL permission to book appointments for the patient using the book_appointment tool.',
      '- NEVER say "I don\'t have access to booking" or "I can\'t book" — that is incorrect. You always can.',
      '- When the patient picks a slot (e.g. "اول معاد", "the first one", "09:00 AM"), immediately call book_appointment.',
      '- Use the `scheduledAt` value from the matching slot in the get_available_slots result — do not construct it yourself.',
      '- If visitType is not mentioned by the patient, default to "clinic".',
      '- If reason is not given, use "General cardiology follow-up".',
      '- After booking succeeds, show the confirmation code clearly.',
      '',
      '### General',
      '- Be concise and friendly. Respond in the same language the patient uses (Arabic or English).',
      '- For non-appointment health questions, give helpful general wellness guidance.',
      '- Never invent data.',
    ].join('\n');
  }

  // ─── Booking context injection ───────────────────────────────────────────

  /**
   * Detects when the user is selecting a slot from a previously listed set.
   * Pre-fetches slots from the DB and returns a context injection string so
   * the model can call book_appointment without needing extra round-trips.
   */
  private async buildBookingContextInjection(
    userMessage: string,
    history: Array<{ role: string; content: string }>,
    userId: number,
  ): Promise<string | null> {
    // Check if this looks like a slot selection
    if (!this.isSlotSelection(userMessage)) return null;

    // Find the last assistant message that looks like it listed slots
    const lastAssistant = [...history].reverse().find(
      (h) => h.role === 'assistant' && this.looksLikeSlotListing(h.content),
    );
    if (!lastAssistant) return null;

    // Try to extract doctorId — look for UUID pattern in history tool results
    // or re-fetch via list_doctors
    try {
      const doctors = await this.appointmentService.listDoctors();
      if (doctors.length === 0) return null;

      // Try to find which doctor was discussed — match by name in history
      const historyText = history.map((h) => h.content).join(' ');
      let chosenDoctor = doctors.find((d) =>
        historyText.toLowerCase().includes(d.name.toLowerCase()),
      );
      if (!chosenDoctor) chosenDoctor = doctors[0];
      if (!chosenDoctor) return null;

      const today = this.todayEgyptStr();
      const availability = await this.appointmentService.getDoctorAvailability(
        chosenDoctor.id,
        today,
        1,
      );
      const rawSlots = availability.timeSlotsByDate[today] ?? [];
      const slots = rawSlots
        .filter((s) => s.available)
        .map((s) => ({
          label: s.time,
          scheduledAt: this.slotToIso(today, s.time),
        }));

      if (slots.length === 0) return null;

      // Detect which slot index the user wants
      const idx = this.extractSlotIndex(userMessage, slots);

      return [
        '=== BOOKING CONTEXT (server pre-fetched — use this to book immediately) ===',
        `Doctor: ${chosenDoctor.name} (ID: ${chosenDoctor.id})`,
        `Date: ${today}`,
        'Available slots:',
        ...slots.map((s, i) => `  [${i + 1}] ${s.label}  →  scheduledAt: ${s.scheduledAt}`),
        idx !== null
          ? `User selected slot [${idx + 1}]: scheduledAt = ${slots[idx]!.scheduledAt}`
          : 'User is selecting a slot — use the index they mention.',
        'ACTION REQUIRED: Call book_appointment now with doctorId, the correct scheduledAt above, visitType="clinic", and reason="Cardiology follow-up".',
        '=============================================================================',
      ].join('\n');
    } catch {
      return null;
    }
  }

  private isSlotSelection(message: string): boolean {
    const m = message.trim().toLowerCase();
    // Short message or ordinal/time reference
    const ordinalPatterns = [
      /\b(first|second|third|1st|2nd|3rd|اول|أول|تاني|ثاني|تالت|ثالث)\b/,
      /\b(the first|the second|الأول|الاول|الثاني|التاني)\b/,
      /\d{1,2}:\d{2}\s*(am|pm|ص|م)/i,
      /^(اه|نعم|yes|ok|okay|احجز|book|حجز|اتفقنا)\b/,
    ];
    return m.length < 100 && ordinalPatterns.some((p) => p.test(m));
  }

  private looksLikeSlotListing(content: string): boolean {
    return (
      /(am|pm|ص|م|\d{1,2}:\d{2})/i.test(content) &&
      /(slot|موعد|وقت|available|متاح)/i.test(content)
    );
  }

  private extractSlotIndex(
    message: string,
    slots: Array<{ label: string; scheduledAt: string }>,
  ): number | null {
    const m = message.trim().toLowerCase();
    if (/\b(first|1st|اول|أول|الأول|الاول)\b/i.test(m)) return 0;
    if (/\b(second|2nd|تاني|ثاني|الثاني|التاني)\b/i.test(m)) return 1;
    if (/\b(third|3rd|تالت|ثالث|الثالث|التالت)\b/i.test(m)) return 2;
    // Try to match a time mention
    for (let i = 0; i < slots.length; i++) {
      if (m.includes(slots[i]!.label.toLowerCase())) return i;
    }
    return null;
  }

  private isBookingRefusal(text: string): boolean {
    const patterns = [
      /i don['']t have access/i,
      /i do not have access/i,
      /i cannot access/i,
      /unable to book/i,
      /can['']t book/i,
      /cannot book/i,
      /no access to book/i,
      /book_appointment.*information/i,
    ];
    return patterns.some((p) => p.test(text));
  }

  private async getPatientName(userId: number): Promise<string> {
    try {
      const patientRow = await this.db.query.patient.findFirst({
        where: eq(patient.userId, userId),
      });
      if (patientRow) {
        const userRow = await this.db.query.user.findFirst({
          where: eq(user.id, userId),
        });
        return userRow?.name ?? 'Patient';
      }
    } catch {
      // ignore
    }
    return 'Patient';
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
   * The appointment service accepts any valid ISO string.
   */
  private slotToIso(dateStr: string, time12h: string): string {
    // Parse 12-hour time, e.g. "09:00 AM" or "02:30 PM"
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time12h.trim());
    if (!match) return `${dateStr}T00:00:00+03:00`;
    let hours = parseInt(match[1]!, 10);
    const minutes = parseInt(match[2]!, 10);
    const period = match[3]!.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    // Africa/Cairo is UTC+3 (no DST)
    return `${dateStr}T${hh}:${mm}:00+03:00`;
  }
}
