import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { blockedDates, doctor, doctorSchedule } from '../../../database/schema';

import type { DayAvailabilityRow } from '../../../database/schema/doctorSchedule.schema';
import type { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import type {
  CreateBlockedDateDto,
  CreateBlockedDatesBatchDto,
} from './dto/blocked-date.dto';

@Injectable()
export class DoctorScheduleService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

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

    if (!schedule) {
      return {
        ...this.createDefaultSchedule(doctorRow.id),
        blockedDates: blocked.map((d) => ({
          id: d.id,
          date: d.date,
          reason: d.reason,
        })),
      };
    }

    return {
      slotDurationMinutes: schedule.slotDurationMinutes,
      bufferBetweenSlotsMinutes: schedule.bufferBetweenSlotsMinutes,
      days: schedule.days,
      blockedDates: blocked.map((d) => ({
        id: d.id,
        date: d.date,
        reason: d.reason,
      })),
    };
  }

  async upsertSchedule(userId: number, dto: UpdateDoctorScheduleDto) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    const existing = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorRow.id),
    });

    const days = dto.days as unknown as DayAvailabilityRow[];

    // Sync blocked dates if provided
    if (dto.blockedDates !== undefined) {
      // Delete existing blocked dates
      await this.db
        .delete(blockedDates)
        .where(eq(blockedDates.doctorId, doctorRow.id));

      // Insert new blocked dates
      if (dto.blockedDates.length > 0) {
        await this.db.insert(blockedDates).values(
          dto.blockedDates.map((bd) => ({
            doctorId: doctorRow.id,
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
        .where(eq(doctorSchedule.doctorId, doctorRow.id))
        .returning();

      // Fetch updated blocked dates
      const blocked = await this.db.query.blockedDates.findMany({
        where: eq(blockedDates.doctorId, doctorRow.id),
        orderBy: (bd, { asc }) => [asc(bd.date)],
      });

      return {
        slotDurationMinutes: updated.slotDurationMinutes,
        bufferBetweenSlotsMinutes: updated.bufferBetweenSlotsMinutes,
        days: updated.days,
        blockedDates: blocked.map((d) => ({
          id: d.id,
          date: d.date,
          reason: d.reason,
        })),
      };
    }

    const [created] = await this.db
      .insert(doctorSchedule)
      .values({
        doctorId: doctorRow.id,
        slotDurationMinutes: dto.slotDurationMinutes,
        bufferBetweenSlotsMinutes: dto.bufferBetweenSlotsMinutes,
        days,
      })
      .returning();

    // Fetch updated blocked dates
    const blocked = await this.db.query.blockedDates.findMany({
      where: eq(blockedDates.doctorId, doctorRow.id),
      orderBy: (bd, { asc }) => [asc(bd.date)],
    });

    return {
      slotDurationMinutes: created.slotDurationMinutes,
      bufferBetweenSlotsMinutes: created.bufferBetweenSlotsMinutes,
      days: created.days,
      blockedDates: blocked.map((d) => ({
        id: d.id,
        date: d.date,
        reason: d.reason,
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

  private createDefaultSchedule(_doctorId: string) {
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
      blockedDates: [],
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
