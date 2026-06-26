import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, asc, eq, gte, lt, ne } from 'drizzle-orm';
import Groq from 'groq-sdk';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  blockedDates,
  doctor,
  doctorSchedule,
  patient,
  scheduleDayExtra,
  user,
} from '../../database/schema';
import type { DayAvailabilityRow } from '../../database/schema/doctorSchedule.schema';
import { DoctorScheduleService } from '../doctor/schedule/doctor-schedule.service';
import {
  timeToMinutes,
  validateTimePeriod,
} from '../doctor/schedule/schedule-periods.util';
import type { UpdateDoctorScheduleDto } from '../doctor/schedule/dto/update-doctor-schedule.dto';
import type { CreateScheduleDayExtraDto } from './dto/schedule-day-extra.dto';
import type { SetDoctorArrivalDto } from './dto/set-doctor-arrival.dto';
import type {
  ScheduleAiAnalysisResult,
  ScheduleAiHistoryItem,
} from './dto/schedule-ai-chat.dto';

const CAIRO_TZ = 'Africa/Cairo';
const WEEKDAY_IDS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

@Injectable()
export class AssistantDoctorScheduleService {
  private readonly logger = new Logger(AssistantDoctorScheduleService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorScheduleService: DoctorScheduleService,
  ) {}

  async getScheduleBundle(doctorId: string) {
    await this.assertDoctorExists(doctorId);
    const base =
      await this.doctorScheduleService.getScheduleByDoctorId(doctorId);
    const bookings = await this.listUpcomingBookings(
      doctorId,
      base.slotDurationMinutes,
    );
    const dayExtras = await this.listDayExtras(doctorId);

    return {
      schedule: {
        slotDurationMinutes: base.slotDurationMinutes,
        bufferBetweenSlotsMinutes: base.bufferBetweenSlotsMinutes,
        days: base.days,
        blockedDates: base.blockedDates,
      },
      pausedPeriodIds: base.pausedPeriodIds,
      doctorArrivalByWeekday: base.doctorArrivalByWeekday,
      bookings,
      dayExtras,
    };
  }

  async listDayExtras(doctorId: string, from?: string, to?: string) {
    await this.assertDoctorExists(doctorId);
    const start = from ?? this.toDateOnly(new Date());
    const endDate = to ? new Date(`${to}T00:00:00`) : new Date();
    if (!to) {
      endDate.setDate(endDate.getDate() + 60);
    }
    const endExclusive = this.toDateOnly(endDate);
    if (endExclusive < start) {
      throw new BadRequestException('Invalid date range');
    }

    const rows = await this.db.query.scheduleDayExtra.findMany({
      where: and(
        eq(scheduleDayExtra.doctorId, doctorId),
        gte(scheduleDayExtra.date, start),
        lt(scheduleDayExtra.date, endExclusive),
      ),
      orderBy: (row, { asc }) => [asc(row.date), asc(row.startTime)],
    });

    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createDayExtra(
    doctorId: string,
    dto: CreateScheduleDayExtraDto,
    actorUserId: number,
  ) {
    await this.assertDoctorExists(doctorId);

    try {
      validateTimePeriod(dto.startTime, dto.endTime);
    } catch {
      throw new BadRequestException('endTime must be after startTime');
    }

    const blocked = await this.db.query.blockedDates.findFirst({
      where: and(
        eq(blockedDates.doctorId, doctorId),
        eq(blockedDates.date, dto.date),
      ),
    });
    if (blocked) {
      throw new BadRequestException('That date is blocked on the calendar');
    }

    const [created] = await this.db
      .insert(scheduleDayExtra)
      .values({
        doctorId,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason?.trim() || null,
      })
      .returning();

    const result = {
      id: created.id,
      date: created.date,
      startTime: created.startTime,
      endTime: created.endTime,
      reason: created.reason,
      createdAt: created.createdAt.toISOString(),
    };

    await this.doctorScheduleService.recordCurrentScheduleRevision(doctorId, {
      userId: actorUserId,
      role: 'assistant',
      source: 'assistant_day_extra_create',
    });

    return result;
  }

  async deleteDayExtra(doctorId: string, extraId: string, actorUserId: number) {
    await this.assertDoctorExists(doctorId);

    const result = await this.db
      .delete(scheduleDayExtra)
      .where(
        and(
          eq(scheduleDayExtra.id, extraId),
          eq(scheduleDayExtra.doctorId, doctorId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Extra hours entry not found');
    }

    await this.doctorScheduleService.recordCurrentScheduleRevision(doctorId, {
      userId: actorUserId,
      role: 'assistant',
      source: 'assistant_day_extra_delete',
    });

    return { deleted: true, id: extraId };
  }

  async upsertSchedule(
    doctorId: string,
    dto: UpdateDoctorScheduleDto,
    actorUserId: number,
  ) {
    await this.assertDoctorExists(doctorId);
    return this.doctorScheduleService.upsertScheduleByDoctorId(doctorId, dto, {
      userId: actorUserId,
      role: 'assistant',
      source: 'assistant_doctor_schedule',
    });
  }

  listScheduleRevisions(doctorId: string, limit?: number) {
    return this.doctorScheduleService.listScheduleRevisions(doctorId, limit);
  }

  getScheduleRevision(doctorId: string, revisionId: string) {
    return this.doctorScheduleService.getScheduleRevision(doctorId, revisionId);
  }

  async togglePausedPeriod(
    doctorId: string,
    periodId: string,
    actorUserId: number,
  ) {
    await this.assertDoctorExists(doctorId);

    const row = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    const current = row?.pausedPeriodIds ?? [];
    const set = new Set(current);
    const paused = set.has(periodId);
    if (paused) set.delete(periodId);
    else set.add(periodId);
    const next = [...set];

    if (row) {
      await this.db
        .update(doctorSchedule)
        .set({ pausedPeriodIds: next, updatedAt: new Date() })
        .where(eq(doctorSchedule.doctorId, doctorId));
    } else {
      await this.db.insert(doctorSchedule).values({
        doctorId,
        days: this.defaultDays(),
        pausedPeriodIds: next,
        doctorArrivalByWeekday: {},
      });
    }

    await this.doctorScheduleService.recordCurrentScheduleRevision(doctorId, {
      userId: actorUserId,
      role: 'assistant',
      source: 'assistant_paused_period',
    });

    return { periodId, paused: !paused, pausedPeriodIds: next };
  }

  async setDoctorArrival(
    doctorId: string,
    dto: SetDoctorArrivalDto,
    actorUserId: number,
  ) {
    await this.assertDoctorExists(doctorId);

    if (!WEEKDAY_IDS.includes(dto.weekday as (typeof WEEKDAY_IDS)[number])) {
      throw new BadRequestException('Invalid weekday');
    }

    const row = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    const current = row?.doctorArrivalByWeekday ?? {};
    const next = { ...current };
    const arrival =
      dto.arrivalTime === undefined ||
      dto.arrivalTime === null ||
      dto.arrivalTime === ''
        ? null
        : dto.arrivalTime;
    if (arrival === null) {
      delete next[dto.weekday];
    } else {
      next[dto.weekday] = arrival;
    }

    if (row) {
      await this.db
        .update(doctorSchedule)
        .set({ doctorArrivalByWeekday: next, updatedAt: new Date() })
        .where(eq(doctorSchedule.doctorId, doctorId));
    } else {
      await this.db.insert(doctorSchedule).values({
        doctorId,
        days: this.defaultDays(),
        pausedPeriodIds: [],
        doctorArrivalByWeekday: next,
      });
    }

    await this.doctorScheduleService.recordCurrentScheduleRevision(doctorId, {
      userId: actorUserId,
      role: 'assistant',
      source: 'assistant_doctor_arrival',
    });

    return {
      weekday: dto.weekday,
      arrivalTime: arrival,
      doctorArrivalByWeekday: next,
    };
  }

  // ─── Schedule AI Chat ────────────────────────────────────────────────────────

  async chatAboutSchedule(
    doctorId: string,
    doctorName: string,
    message: string,
    history: ScheduleAiHistoryItem[],
  ): Promise<{ reply: string }> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI unavailable — GROQ_API_KEY not configured',
      );
    }

    const [bundle, revisions] = await Promise.all([
      this.getScheduleBundle(doctorId),
      this.doctorScheduleService.listScheduleRevisions(doctorId, 5),
    ]);

    const context = this.buildScheduleContext(doctorName, bundle, revisions);

    const systemPrompt = [
      `You are a clinic scheduling assistant helping the clinic assistant manage Dr. ${doctorName}'s schedule.`,
      'You have access to the current schedule, upcoming bookings, and recent change history below.',
      'Answer questions concisely and accurately based ONLY on the provided schedule data.',
      'If you suggest changes, describe them as clear, actionable steps the assistant can take.',
      'Do NOT invent appointments, patients, or data not in the context.',
      'Respond in the same language the user writes in (Arabic or English).',
      '',
      '=== SCHEDULE CONTEXT ===',
      context,
      '========================',
    ].join('\n');

    const groq = new Groq({ apiKey });
    const model =
      process.env.GROQ_CHAT_MODEL?.trim() ||
      'meta-llama/llama-4-scout-17b-16e-instruct';

    const recentHistory = history.slice(-8);

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const reply =
        completion.choices[0]?.message?.content?.trim() ||
        'No reply generated.';
      return { reply };
    } catch (error) {
      this.logger.error('Groq schedule chat failed', error);
      throw new ServiceUnavailableException(
        'AI service temporarily unavailable',
      );
    }
  }

  async analyzeSchedule(
    doctorId: string,
    doctorName: string,
  ): Promise<ScheduleAiAnalysisResult> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI unavailable — GROQ_API_KEY not configured',
      );
    }

    const [bundle, revisions] = await Promise.all([
      this.getScheduleBundle(doctorId),
      this.doctorScheduleService.listScheduleRevisions(doctorId, 10),
    ]);

    const context = this.buildScheduleContext(doctorName, bundle, revisions);

    const systemPrompt = [
      `You are a clinical scheduling expert analyzing Dr. ${doctorName}'s weekly clinic schedule.`,
      'Return ONLY a valid JSON object — no markdown fences, no commentary, no extra text.',
      'The JSON must have exactly these keys:',
      '  "insights": array of 4-6 factual, specific observations about the current schedule (use numbers from the data)',
      '  "risks": array of 2-4 concrete risk or warning strings (empty array if none found)',
      '  "recommendations": array of 3-5 specific, actionable improvement suggestions',
      'Be precise. Reference actual numbers (hours, days, booking counts, etc.) from the schedule data.',
      '',
      '=== SCHEDULE DATA ===',
      context,
      '=====================',
    ].join('\n');

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_ANALYSIS_MODEL?.trim() || 'qwen/qwen3-32b';

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content:
              "Analyze this doctor's schedule and return the JSON object.",
          },
        ],
        temperature: 0.6,
        max_completion_tokens: 2048,
        top_p: 0.95,
        stream: false,
        reasoning_effort: 'default',
      });

      let raw = completion.choices[0]?.message?.content?.trim() ?? '';

      // Strip any <think>...</think> blocks that may appear
      raw = raw.replace(/<think[\s\S]*?<\/think>/gi, '').trim();

      // Strip markdown code fences if present
      raw = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(raw) as Partial<ScheduleAiAnalysisResult>;

      return {
        insights: Array.isArray(parsed.insights)
          ? parsed.insights.map(String)
          : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations.map(String)
          : [],
      };
    } catch (error) {
      this.logger.error('Groq schedule analysis failed', error);
      throw new ServiceUnavailableException(
        'AI analysis temporarily unavailable',
      );
    }
  }

  private buildScheduleContext(
    doctorName: string,
    bundle: Awaited<
      ReturnType<AssistantDoctorScheduleService['getScheduleBundle']>
    >,
    revisions: Awaited<
      ReturnType<DoctorScheduleService['listScheduleRevisions']>
    >,
  ): string {
    const {
      schedule,
      bookings,
      dayExtras,
      pausedPeriodIds,
      doctorArrivalByWeekday,
    } = bundle;

    const lines: string[] = [];
    lines.push(`Doctor: ${doctorName}`);

    lines.push('\n## Weekly Template');
    lines.push(`Slot duration: ${schedule.slotDurationMinutes} min`);
    lines.push(
      `Buffer between slots: ${schedule.bufferBetweenSlotsMinutes} min`,
    );

    const activeDays = schedule.days.filter((d) => d.enabled);
    lines.push(`Active days: ${activeDays.length} of 7`);

    for (const day of schedule.days) {
      if (!day.enabled) continue;
      const periods = day.periods
        .map((p) => {
          const paused = pausedPeriodIds.includes(p.id);
          return `${p.startTime}–${p.endTime}${paused ? ' [PAUSED]' : ''}`;
        })
        .join(', ');
      const arrival = doctorArrivalByWeekday[day.weekday];
      const arrivalNote = arrival ? ` (doctor arrives ${arrival})` : '';
      lines.push(
        `  ${day.label}: ${periods || 'no periods defined'}${arrivalNote}`,
      );
    }

    if (schedule.blockedDates.length > 0) {
      lines.push(`\n## Blocked Dates (${schedule.blockedDates.length} total)`);
      for (const bd of schedule.blockedDates.slice(0, 12)) {
        lines.push(`  ${bd.date}${bd.reason ? ` — ${bd.reason}` : ''}`);
      }
    }

    if (dayExtras.length > 0) {
      lines.push(`\n## One-off Extra Sessions (${dayExtras.length} upcoming)`);
      for (const de of dayExtras.slice(0, 10)) {
        lines.push(
          `  ${de.date}: ${de.startTime}–${de.endTime}${de.reason ? ` (${de.reason})` : ''}`,
        );
      }
    }

    lines.push(
      `\n## Upcoming Bookings — Next 14 Days (Total: ${bookings.length})`,
    );
    if (bookings.length === 0) {
      lines.push('  No upcoming bookings.');
    } else {
      const byDate: Record<string, typeof bookings> = {};
      for (const b of bookings) {
        (byDate[b.scheduledDate] ??= []).push(b);
      }
      for (const [date, bs] of Object.entries(byDate).slice(0, 10)) {
        const slots = bs.map((b) => b.startTime).join(', ');
        lines.push(
          `  ${date} (${bs[0].weekday}): ${bs.length} booking${bs.length > 1 ? 's' : ''} at ${slots}`,
        );
      }
    }

    if (revisions.length > 0) {
      lines.push(`\n## Recent Schedule Changes (last ${revisions.length})`);
      for (const rev of revisions) {
        const s = rev.snapshotSummary;
        lines.push(
          `  Rev #${rev.revisionNumber} (${rev.createdAt.slice(0, 10)}, by ${rev.changedByRole ?? 'system'}): ` +
            `${s.enabledDays} active days, ${s.periodCount} periods, ${s.blockedDatesCount} blocked dates`,
        );
      }
    }

    return lines.join('\n');
  }

  // ─── Bookings list (private) ──────────────────────────────────────────────────

  private async listUpcomingBookings(
    doctorId: string,
    slotDurationMinutes: number,
  ) {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 14);

    const rows = await this.db
      .select({
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        status: appointment.status,
        patientName: user.name,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          gte(appointment.scheduledAt, now),
          lt(appointment.scheduledAt, horizon),
          ne(appointment.status, 'cancelled'),
        ),
      )
      .orderBy(asc(appointment.scheduledAt));

    return rows.map((row) => {
      const scheduledDate = this.toDateOnly(row.scheduledAt);
      const startTime = this.toHHMM(row.scheduledAt);
      const endMin =
        timeToMinutes(startTime) + Math.max(slotDurationMinutes, 10);
      const endTime = this.minutesToHm(endMin);
      const weekday = this.weekdayFromDate(row.scheduledAt);

      return {
        id: row.id,
        weekday,
        scheduledDate,
        startTime,
        endTime,
        patientLabel: row.patientName,
        avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(row.patientName)}`,
        status: row.status,
      };
    });
  }

  private async assertDoctorExists(doctorId: string) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });
    if (!doctorRow) {
      throw new NotFoundException('Doctor not found');
    }
    return doctorRow;
  }

  private defaultDays(): DayAvailabilityRow[] {
    return WEEKDAY_IDS.map((weekday) => ({
      weekday,
      label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      enabled: false,
      periods: [],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    }));
  }

  private toDateOnly(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CAIRO_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
  }

  private toHHMM(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CAIRO_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
  }

  private weekdayFromDate(date: Date): string {
    const long = new Intl.DateTimeFormat('en-US', {
      timeZone: CAIRO_TZ,
      weekday: 'long',
    }).format(date);
    return long.toLowerCase();
  }

  private minutesToHm(total: number) {
    const m = Math.max(0, Math.round(total));
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
}
