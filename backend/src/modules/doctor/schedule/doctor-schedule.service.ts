import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  blockedDates,
  doctor,
  doctorSchedule,
  scheduleDayExtra,
} from '../../../database/schema';

import type { DayAvailabilityRow } from '../../../database/schema/doctorSchedule.schema';
import type { DoctorScheduleSnapshot } from '../../../database/schema/doctorScheduleRevision.schema';
import type { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import type {
  CreateBlockedDateDto,
  CreateBlockedDatesBatchDto,
} from './dto/blocked-date.dto';
import {
  DoctorScheduleRevisionService,
  type ScheduleRevisionActor,
} from './doctor-schedule-revision.service';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisionService: DoctorScheduleRevisionService,
  ) {}

  async getSchedule(userId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    const schedule = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorRow.id),
    });

    const blocked = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorRow.id),
      orderBy: (bd, { asc }) => [asc(bd.date)],
    });

    return this.formatScheduleResponse(schedule, blocked);
  }

  async getScheduleByDoctorId(doctorId: string) {
    const schedule = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    const blocked = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorId),
      orderBy: (bd, { asc }) => [asc(bd.date)],
    });

    return this.formatScheduleResponse(schedule, blocked);
  }

  async upsertScheduleByDoctorId(
    doctorId: string,
    dto: UpdateDoctorScheduleDto,
    actor?: ScheduleRevisionActor,
  ) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor not found');
    }

    return this.upsertScheduleForDoctor(doctorRow.id, dto, actor);
  }

  async upsertSchedule(
    userId: number,
    dto: UpdateDoctorScheduleDto,
    actor?: ScheduleRevisionActor,
  ) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    return this.upsertScheduleForDoctor(doctorRow.id, dto, actor);
  }

  async listScheduleRevisions(doctorId: string, limit?: number) {
    return this.revisionService.listRevisions(doctorId, limit);
  }

  async getScheduleRevision(doctorId: string, revisionId: string) {
    return this.revisionService.getRevision(doctorId, revisionId);
  }

  async listScheduleRevisionsForUser(userId: number, limit?: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.listScheduleRevisions(doctorRow.id, limit);
  }

  async getScheduleRevisionForUser(
    userId: number,
    revisionId: string,
  ) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.getScheduleRevision(doctorRow.id, revisionId);
  }

  private async upsertScheduleForDoctor(
    doctorId: string,
    dto: UpdateDoctorScheduleDto,
    actor?: ScheduleRevisionActor,
  ) {
    const existing = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    const days = dto.days as unknown as DayAvailabilityRow[];

    if (dto.blockedDates !== undefined) {
      await this.db
        .delete(blockedDates)
        .where(eq(blockedDates.doctorId, doctorId));

      if (dto.blockedDates.length > 0) {
        await this.db.insert(blockedDates).values(
          dto.blockedDates.map((bd) => ({
            doctorId,
            date: bd.date,
            reason: bd.reason,
          })),
        );
      }
    }

    if (existing) {
      const [updated] = await this.db
        .update(doctorSchedule)
        .set({
          slotDurationMinutes: dto.slotDurationMinutes,
          bufferBetweenSlotsMinutes: dto.bufferBetweenSlotsMinutes,
          days,
          updatedAt: new Date(),
        })
        .where(eq(doctorSchedule.doctorId, doctorId))
        .returning();

      const blocked = await this.db.query.blockedDates.findMany({
        where: eq(blockedDates.doctorId, doctorId),
        orderBy: (bd, { asc }) => [asc(bd.date)],
      });

      const response = this.formatScheduleResponse(updated, blocked);
      await this.recordCurrentScheduleRevision(doctorId, actor);
      return response;
    }

    const [created] = await this.db
      .insert(doctorSchedule)
      .values({
        doctorId,
        slotDurationMinutes: dto.slotDurationMinutes,
        bufferBetweenSlotsMinutes: dto.bufferBetweenSlotsMinutes,
        days,
        pausedPeriodIds: [],
        doctorArrivalByWeekday: {},
      })
      .returning();

    const blocked = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorId),
      orderBy: (bd, { asc }) => [asc(bd.date)],
    });

    const response = this.formatScheduleResponse(created, blocked);
    await this.recordCurrentScheduleRevision(doctorId, actor);
    return response;
  }

  async recordCurrentScheduleRevision(
    doctorId: string,
    actor?: ScheduleRevisionActor,
  ) {
    const snapshot = await this.captureScheduleSnapshot(doctorId);
    await this.revisionService.recordRevision(doctorId, snapshot, actor);
  }

  private async captureScheduleSnapshot(
    doctorId: string,
  ): Promise<DoctorScheduleSnapshot> {
    const response = await this.getScheduleByDoctorId(doctorId);
    const dayExtraRows = await this.db.query.scheduleDayExtra.findMany({
      where: eq(scheduleDayExtra.doctorId, doctorId),
      orderBy: (row, { asc }) => [asc(row.date), asc(row.startTime)],
    });

    return {
      slotDurationMinutes: response.slotDurationMinutes,
      bufferBetweenSlotsMinutes: response.bufferBetweenSlotsMinutes,
      days: response.days,
      blockedDates: response.blockedDates,
      pausedPeriodIds: response.pausedPeriodIds,
      doctorArrivalByWeekday: response.doctorArrivalByWeekday,
      dayExtras: dayExtraRows.map((row) => ({
        id: row.id,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        reason: row.reason,
      })),
    };
  }

  async deleteSchedule(userId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    await this.db
      .delete(doctorSchedule)
      .where(eq(doctorSchedule.doctorId, doctorRow.id));

    // Also clear blocked dates
    await this.db
      .delete(blockedDates)
      .where(eq(blockedDates.doctorId, doctorRow.id));

    return { deleted: true };
  }

  private formatScheduleResponse(
    schedule:
      | {
          slotDurationMinutes: number;
          bufferBetweenSlotsMinutes: number;
          days: DayAvailabilityRow[];
          pausedPeriodIds?: string[] | null;
          doctorArrivalByWeekday?: Record<string, string | null> | null;
        }
      | null
      | undefined,
    blocked: { id: string; date: string; reason: string | null }[],
  ) {
    const defaults = this.createDefaultSchedule();
    const base = schedule ?? defaults;

    return {
      slotDurationMinutes: base.slotDurationMinutes,
      bufferBetweenSlotsMinutes: base.bufferBetweenSlotsMinutes,
      days: base.days,
      pausedPeriodIds: schedule?.pausedPeriodIds ?? [],
      doctorArrivalByWeekday: schedule?.doctorArrivalByWeekday ?? {},
      blockedDates: blocked.map((d) => ({
        id: d.id,
        date: d.date,
        reason: d.reason,
      })),
    };
  }

  private createDefaultSchedule() {
    const defaultDays: DayAvailabilityRow[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ].map((weekday) => ({
      weekday,
      label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      enabled: false,
      periods: [],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    }));

    return {
      slotDurationMinutes: 30,
      bufferBetweenSlotsMinutes: 10,
      days: defaultDays,
      pausedPeriodIds: [] as string[],
      doctorArrivalByWeekday: {} as Record<string, string | null>,
      blockedDates: [] as { id: string; date: string; reason: string | null }[],
    };
  }

  // ========== Blocked Dates Methods ==========

  async getBlockedDates(userId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    const dates = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorRow.id),
      orderBy: (blockedDates, { asc }) => [asc(blockedDates.date)],
    });

    return dates.map((d) => ({
      id: d.id,
      date: d.date,
      reason: d.reason,
    }));
  }

  async addBlockedDate(userId: number, dto: CreateBlockedDateDto) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Check if date is already blocked
    const existing = await this.db.query.blockedDates.findFirst({
      where: (bd) => and(eq(bd.doctorId, doctorRow.id), eq(bd.date, dto.date)),
    });

    if (existing) {
      throw new Error('Date is already blocked');
    }

    const [created] = await this.db
      .insert(blockedDates)
      .values({
        doctorId: doctorRow.id,
        date: dto.date,
        reason: dto.reason,
      })
      .returning();

    return {
      id: created.id,
      date: created.date,
      reason: created.reason,
    };
  }

  async addBlockedDatesBatch(userId: number, dto: CreateBlockedDatesBatchDto) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Get existing blocked dates
    const existingDates = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorRow.id),
    });

    const existingDateSet = new Set(existingDates.map((d) => d.date));

    // Filter out duplicates
    const newDates = dto.dates.filter((d) => !existingDateSet.has(d.date));

    if (newDates.length === 0) {
      return { added: 0, message: 'All dates are already blocked' };
    }

    // Insert new dates
    const created = await this.db
      .insert(blockedDates)
      .values(
        newDates.map((d) => ({
          doctorId: doctorRow.id,
          date: d.date,
          reason: d.reason,
        })),
      )
      .returning();

    return {
      added: created.length,
      dates: created.map((c) => ({
        id: c.id,
        date: c.date,
        reason: c.reason,
      })),
    };
  }

  async removeBlockedDate(userId: number, date: string) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    const result = await this.db
      .delete(blockedDates)
      .where(
        and(
          eq(blockedDates.doctorId, doctorRow.id),
          eq(blockedDates.date, date),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Blocked date not found');
    }

    return { deleted: true, date };
  }

  async clearAllBlockedDates(userId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    await this.db
      .delete(blockedDates)
      .where(eq(blockedDates.doctorId, doctorRow.id));

    return { deleted: true };
  }
}
