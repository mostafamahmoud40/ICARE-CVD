import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { doctor, doctorSchedule, user } from '../../../database/schema';

import type { DayAvailabilityRow } from '../../../database/schema/doctorSchedule.schema';
import type { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

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

    if (!schedule) {
      return this.createDefaultSchedule(doctorRow.id);
    }

    return {
      slotDurationMinutes: schedule.slotDurationMinutes,
      bufferBetweenSlotsMinutes: schedule.bufferBetweenSlotsMinutes,
      days: schedule.days,
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

      return {
        slotDurationMinutes: updated.slotDurationMinutes,
        bufferBetweenSlotsMinutes: updated.bufferBetweenSlotsMinutes,
        days: updated.days,
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

    return {
      slotDurationMinutes: created.slotDurationMinutes,
      bufferBetweenSlotsMinutes: created.bufferBetweenSlotsMinutes,
      days: created.days,
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
    };
  }
}
