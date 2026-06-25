import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  doctor,
  doctorSchedule,
  patientQueue,
  user,
} from '../../database/schema';
import type { DayAvailabilityRow } from '../../database/schema/doctorSchedule.schema';
import { AppointmentService } from '../appointment/appointment.service';
import { DoctorScheduleService } from '../doctor/schedule/doctor-schedule.service';

export type AssistantDoctorDirectoryStatus =
  | 'available'
  | 'in-consultation'
  | 'away';

export type AssistantDoctorLoadLevel =
  | 'optimal'
  | 'moderate'
  | 'high'
  | 'inactive';

type QueueOperationalRow = {
  doctorId: string;
  status: (typeof patientQueue.$inferSelect)['status'];
  roomNumber: string | null;
};

@Injectable()
export class AssistantDoctorsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorScheduleService: DoctorScheduleService,
    private readonly appointmentService: AppointmentService,
  ) {}

  async listDirectory() {
    const doctors = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        avatarUrl: user.avatarUrl,
        clinicLocation: doctor.clinicLocation,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(user.role, 'doctor'));

    if (doctors.length === 0) return [];

    const doctorIds = doctors.map((row) => row.id);
    const { todayStart, todayEnd, weekday } = this.todayBounds();
    const operational = await this.loadOperationalByDoctor(
      doctorIds,
      todayStart,
      todayEnd,
    );
    const schedules = await this.db.query.doctorSchedule.findMany({
      where: inArray(doctorSchedule.doctorId, doctorIds),
    });
    const scheduleByDoctor = new Map(
      schedules.map((row) => [row.doctorId, row.days]),
    );

    return doctors.map((row) => {
      const op = operational.get(row.id);
      const day = scheduleByDoctor
        .get(row.id)
        ?.find((item) => item.weekday === weekday);
      const shift = this.summarizeDayShift(day);
      const patientsWaiting = op?.patientsWaiting ?? 0;
      const status = this.resolveStatus(op, day);
      const room =
        op?.activeRoom?.trim() || row.clinicLocation?.trim() || undefined;

      return {
        id: row.id,
        name: row.name,
        specialty: row.specialty?.trim() || 'General practice',
        status,
        patientsWaiting,
        loadLevel: this.resolveLoadLevel(patientsWaiting, status, day),
        avatarUrl: row.avatarUrl?.trim() || null,
        room: room || undefined,
        shiftStart: shift.start,
        shiftEnd: shift.end,
      };
    });
  }

  async getClinicProfile(doctorId: string) {
    const rows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        specialty: doctor.specialty,
        title: doctor.title,
        experienceYears: doctor.experienceYears,
        about: doctor.about,
        clinicName: doctor.clinicName,
        clinicLocation: doctor.clinicLocation,
        acceptedVisitModes: doctor.acceptedVisitModes,
        languages: doctor.languages,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.id, doctorId))
      .limit(1);

    if (!rows.length) {
      throw new NotFoundException('Doctor not found');
    }

    const row = rows[0];
    const schedule =
      await this.doctorScheduleService.getScheduleByDoctorId(doctorId);
    const { todayStart, todayEnd, weekday } = this.todayBounds();
    const operational = await this.loadOperationalByDoctor(
      [doctorId],
      todayStart,
      todayEnd,
    );
    const op = operational.get(doctorId);
    const todaySchedule = schedule.days.find((day) => day.weekday === weekday);
    const todayShift = this.summarizeDayShift(todaySchedule);
    const status = this.resolveStatus(op, todaySchedule);
    const availableSlotsByWeekday =
      await this.availableSlotsByWeekday(doctorId);

    return {
      id: row.id,
      name: row.name,
      avatarUrl: row.avatarUrl?.trim() || null,
      specialty: row.specialty?.trim() || 'General practice',
      title: row.title?.trim() || row.specialty?.trim() || 'Physician',
      experienceYears: row.experienceYears ?? 0,
      about: row.about?.trim() || '',
      clinicName: row.clinicName?.trim() || '',
      clinicLocation: row.clinicLocation?.trim() || '',
      acceptedVisitModes: this.normalizeVisitModes(row.acceptedVisitModes),
      languages: Array.isArray(row.languages)
        ? row.languages.filter((item) => typeof item === 'string')
        : [],
      status,
      patientsWaiting: op?.patientsWaiting ?? 0,
      patientsInConsultation: op?.patientsInConsultation ?? 0,
      room: op?.activeRoom?.trim() || undefined,
      todayShiftStart: todayShift.start,
      todayShiftEnd: todayShift.end,
      schedule: {
        slotDurationMinutes: schedule.slotDurationMinutes,
        bufferBetweenSlotsMinutes: schedule.bufferBetweenSlotsMinutes,
        days: schedule.days.map((day) => ({
          weekday: day.weekday,
          label: day.label,
          enabled: day.enabled,
          periods: day.periods.map((period) => ({
            startTime: period.startTime,
            endTime: period.endTime,
          })),
          availableSlotCount: day.enabled
            ? (availableSlotsByWeekday.get(day.weekday)?.count ?? 0)
            : 0,
          availableSlotTimes: day.enabled
            ? (availableSlotsByWeekday.get(day.weekday)?.times ?? [])
            : [],
          nextOccurrenceDate: day.enabled
            ? (availableSlotsByWeekday.get(day.weekday)?.nextDate ?? null)
            : null,
        })),
      },
    };
  }

  private async availableSlotsByWeekday(doctorId: string) {
    const map = new Map<
      string,
      { count: number; times: string[]; nextDate: string | null }
    >();
    const availability = await this.appointmentService.getDoctorAvailability(
      doctorId,
      undefined,
      14,
    );

    for (const day of availability.days) {
      if (day.disabled) continue;

      const weekday = this.weekdayIdFromDateOnly(day.fullDate);
      if (map.has(weekday)) continue;

      const slots = availability.timeSlotsByDate[day.fullDate] ?? [];
      const available = slots.filter((slot) => slot.available);

      map.set(weekday, {
        count: available.length,
        times: available.map((slot) => slot.time),
        nextDate: day.fullDate,
      });
    }

    return map;
  }

  private weekdayIdFromDateOnly(dateOnly: string) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      weekday: 'long',
    })
      .format(new Date(`${dateOnly}T12:00:00`))
      .toLowerCase();
  }

  private async loadOperationalByDoctor(
    doctorIds: string[],
    todayStart: Date,
    todayEnd: Date,
  ) {
    const map = new Map<
      string,
      {
        patientsWaiting: number;
        patientsInConsultation: number;
        activeRoom: string | null;
        hasInConsultation: boolean;
        hasWaiting: boolean;
      }
    >();

    for (const doctorId of doctorIds) {
      map.set(doctorId, {
        patientsWaiting: 0,
        patientsInConsultation: 0,
        activeRoom: null,
        hasInConsultation: false,
        hasWaiting: false,
      });
    }

    if (doctorIds.length === 0) return map;

    const rows = await this.db
      .select({
        doctorId: appointment.doctorId,
        status: patientQueue.status,
        roomNumber: patientQueue.roomNumber,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(
          inArray(appointment.doctorId, doctorIds),
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
        ),
      );

    for (const row of rows as QueueOperationalRow[]) {
      const current = map.get(row.doctorId);
      if (!current) continue;

      if (row.status === 'waiting' || row.status === 'arrived') {
        current.patientsWaiting += 1;
        current.hasWaiting = true;
      }

      if (row.status === 'in-consultation') {
        current.patientsInConsultation += 1;
        current.hasInConsultation = true;
        if (!current.activeRoom && row.roomNumber?.trim()) {
          current.activeRoom = row.roomNumber.trim();
        }
      }
    }

    return map;
  }

  private resolveStatus(
    op:
      | {
          hasInConsultation: boolean;
          hasWaiting: boolean;
        }
      | undefined,
    day: DayAvailabilityRow | undefined,
  ): AssistantDoctorDirectoryStatus {
    if (op?.hasInConsultation) return 'in-consultation';
    if (op?.hasWaiting) return 'available';
    if (day?.enabled && day.periods.length > 0) return 'available';
    return 'away';
  }

  private resolveLoadLevel(
    patientsWaiting: number,
    status: AssistantDoctorDirectoryStatus,
    day: DayAvailabilityRow | undefined,
  ): AssistantDoctorLoadLevel {
    if (status === 'away' || !day?.enabled) return 'inactive';
    if (patientsWaiting >= 5) return 'high';
    if (patientsWaiting >= 3) return 'moderate';
    return 'optimal';
  }

  private summarizeDayShift(day: DayAvailabilityRow | undefined) {
    if (!day?.enabled || !day.periods.length) {
      return { start: null as string | null, end: null as string | null };
    }

    const periods = day.periods.filter(
      (period) => period.startTime && period.endTime,
    );
    if (!periods.length) {
      return { start: null as string | null, end: null as string | null };
    }

    const starts = periods.map((period) => period.startTime).sort();
    const ends = periods.map((period) => period.endTime).sort();

    return {
      start: this.formatTimeLabel(starts[0]),
      end: this.formatTimeLabel(ends[ends.length - 1]),
    };
  }

  private formatTimeLabel(value: string) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) return value;

    const hours = Number(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutes} ${period}`;
  }

  private normalizeVisitModes(
    value: string | null | undefined,
  ): 'clinic' | 'virtual' | 'both' {
    if (value === 'clinic' || value === 'virtual') return value;
    return 'both';
  }

  private todayBounds() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);

    const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
    const month = parts.find((part) => part.type === 'month')?.value ?? '01';
    const day = parts.find((part) => part.type === 'day')?.value ?? '01';
    const dateKey = `${year}-${month}-${day}`;

    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      weekday: 'long',
    })
      .format(now)
      .toLowerCase();

    const todayStart = new Date(`${dateKey}T00:00:00+02:00`);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return { todayStart, todayEnd, weekday };
  }
}
