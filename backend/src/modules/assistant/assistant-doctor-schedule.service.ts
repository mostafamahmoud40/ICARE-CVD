import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, gte, lt, ne } from 'drizzle-orm';

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
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorScheduleService: DoctorScheduleService,
  ) {}

  async getScheduleBundle(doctorId: string) {
    await this.assertDoctorExists(doctorId);
    const base = await this.doctorScheduleService.getScheduleByDoctorId(doctorId);
    const bookings = await this.listUpcomingBookings(doctorId, base.slotDurationMinutes);
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

  async deleteDayExtra(
    doctorId: string,
    extraId: string,
    actorUserId: number,
  ) {
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
      dto.arrivalTime === undefined || dto.arrivalTime === null || dto.arrivalTime === ''
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

    return { weekday: dto.weekday, arrivalTime: arrival, doctorArrivalByWeekday: next };
  }

  private async listUpcomingBookings(doctorId: string, slotDurationMinutes: number) {
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
