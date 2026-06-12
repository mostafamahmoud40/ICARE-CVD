import { randomInt } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, lt, ne } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  appointmentAttachment,
  doctor,
  doctorSchedule,
  patient,
  user,
  blockedDates,
  scheduleDayExtra,
} from '../../database/schema';
import { mergePeriodsForDate } from '../doctor/schedule/schedule-periods.util';
import type { CreateAppointmentDto } from './dto/create-appointment.dto';
import type { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentService {
  private readonly clinicTimeZone = 'Africa/Cairo';

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listDoctors() {
    const rows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        experienceYears: doctor.experienceYears,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(user.role, 'doctor'));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      title: row.specialty ?? 'Cardiologist',
      experience: `${row.experienceYears ?? 0}+ Years Exp.`,
      specialties: [
        {
          icon: 'heart',
          label: row.specialty ?? 'Cardiology',
          color: 'primary' as const,
        },
      ],
    }));
  }

  async getDoctorAvailability(doctorId: string, from?: string, days = 14) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, doctorId),
    });
    if (!doctorRow) {
      throw new NotFoundException('Doctor not found');
    }

    const schedule = await this.db.query.doctorSchedule.findFirst({
      where: eq(doctorSchedule.doctorId, doctorId),
    });

    if (!schedule) {
      return {
        monthLabel: this.getMonthLabel(new Date()),
        days: [],
        timeSlotsByDate: {},
      };
    }

    const start = from ? this.parseDateOnly(from) : this.startOfDay(new Date());
    const safeDays = Math.min(Math.max(days, 1), 31);
    const endExclusive = new Date(start);
    endExclusive.setDate(endExclusive.getDate() + safeDays);

    const blocked = await this.db.query.blockedDates.findMany({
      where: and(
        eq(blockedDates.doctorId, doctorId),
        gte(blockedDates.date, this.toDateOnly(start)),
        lt(blockedDates.date, this.toDateOnly(endExclusive)),
      ),
      orderBy: (bd) => [asc(bd.date)],
    });
    const blockedSet = new Set(blocked.map((b) => b.date));

    const extras = await this.db.query.scheduleDayExtra.findMany({
      where: and(
        eq(scheduleDayExtra.doctorId, doctorId),
        gte(scheduleDayExtra.date, this.toDateOnly(start)),
        lt(scheduleDayExtra.date, this.toDateOnly(endExclusive)),
      ),
      orderBy: (row, { asc }) => [asc(row.date), asc(row.startTime)],
    });
    const extrasByDate = new Map<string, Array<{ startTime: string; endTime: string }>>();
    for (const extra of extras) {
      const list = extrasByDate.get(extra.date) ?? [];
      list.push({ startTime: extra.startTime, endTime: extra.endTime });
      extrasByDate.set(extra.date, list);
    }

    const apptQueryStart = new Date(start);
    apptQueryStart.setDate(apptQueryStart.getDate() - 1);
    const apptQueryEnd = new Date(endExclusive);
    apptQueryEnd.setDate(apptQueryEnd.getDate() + 1);

    const appts = await this.db.query.appointment.findMany({
      where: and(
        eq(appointment.doctorId, doctorId),
        gte(appointment.scheduledAt, apptQueryStart),
        lt(appointment.scheduledAt, apptQueryEnd),
      ),
      orderBy: (a) => [asc(a.scheduledAt)],
    });

    const appointmentCountByDate = new Map<string, number>();
    const bookedTimesByDate = new Map<string, Set<string>>();
    for (const a of appts) {
      if (a.status === 'cancelled') continue;
      const key = this.toDateOnly(a.scheduledAt);
      if (
        key < this.toDateOnly(start) ||
        key >= this.toDateOnly(endExclusive)
      ) {
        continue;
      }
      appointmentCountByDate.set(
        key,
        (appointmentCountByDate.get(key) ?? 0) + 1,
      );
      const time = this.toHHMM(a.scheduledAt);
      const set = bookedTimesByDate.get(key) ?? new Set<string>();
      set.add(time);
      bookedTimesByDate.set(key, set);
    }

    const daysPayload: Array<{
      day: string;
      date: number;
      fullDate: string;
      disabled?: boolean;
      label?: string;
    }> = [];
    const timeSlotsByDate: Record<
      string,
      Array<{
        time: string;
        available: boolean;
        recommended?: boolean;
        label?: string;
      }>
    > = {};

    for (let i = 0; i < safeDays; i += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const fullDate = this.toDateOnly(current);
      const weekday = this.weekdayId(current);
      const dayConfig = schedule.days.find((d) => d.weekday === weekday);
      const blockedDay = blockedSet.has(fullDate);
      const maxPerDay = dayConfig?.maxAppointmentsPerDay ?? null;
      const appointmentCount = appointmentCountByDate.get(fullDate) ?? 0;
      const dateExtras = extrasByDate.get(fullDate) ?? [];
      const weeklyEnabled = !!dayConfig?.enabled;
      const hasExtras = dateExtras.length > 0;
      const enabled = (weeklyEnabled || hasExtras) && !blockedDay;
      const reachedLimit = maxPerDay !== null && appointmentCount >= maxPerDay;

      daysPayload.push({
        day: this.weekdayLabelShort(current),
        date: current.getDate(),
        fullDate,
        disabled: !enabled || reachedLimit,
      });

      if (!enabled || reachedLimit) {
        timeSlotsByDate[fullDate] = [];
        continue;
      }

      const weeklyPeriods = weeklyEnabled ? (dayConfig?.periods ?? []) : [];
      const periods = mergePeriodsForDate(weeklyPeriods, dateExtras);
      if (periods.length === 0) {
        timeSlotsByDate[fullDate] = [];
        continue;
      }

      const unavailable = dayConfig?.unavailableBlocks ?? [];
      const bookedSet = bookedTimesByDate.get(fullDate) ?? new Set<string>();
      const slots = this.generateSlots(
        periods,
        unavailable,
        schedule.slotDurationMinutes,
        schedule.bufferBetweenSlotsMinutes,
      ).map((slotTime) => {
        const booked = bookedSet.has(slotTime);
        return {
          time: this.toAmPm(slotTime),
          available: !booked,
          label: booked ? 'Booked' : undefined,
        };
      });

      timeSlotsByDate[fullDate] = slots;
      const isFullyBooked =
        slots.length > 0 && slots.every((slot) => !slot.available);
      if (isFullyBooked) {
        const targetDay = daysPayload.find((d) => d.fullDate === fullDate);
        if (targetDay) {
          targetDay.label = 'Booked';
          targetDay.disabled = true;
        }
      }
    }

    return {
      monthLabel: this.getMonthLabel(start),
      days: daysPayload,
      timeSlotsByDate,
    };
  }

  async listPatientAppointments(userId: number) {
    const patientRow = await this.getOrCreatePatientProfile(userId);

    let rows: Array<{
      id: string;
      confirmationCode: string;
      scheduledAt: Date;
      visitType: string;
      status: string;
      reason: string | null;
      symptoms: string | null;
      notes: string | null;
      doctorName: string;
      doctorSpecialty: string | null;
    }> = [];

    try {
      rows = await this.db
        .select({
          id: appointment.id,
          confirmationCode: appointment.confirmationCode,
          scheduledAt: appointment.scheduledAt,
          visitType: appointment.visitType,
          status: appointment.status,
          reason: appointment.reason,
          symptoms: appointment.symptoms,
          notes: appointment.notes,
          doctorName: user.name,
          doctorSpecialty: doctor.specialty,
        })
        .from(appointment)
        .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
        .innerJoin(user, eq(doctor.userId, user.id))
        .where(eq(appointment.patientId, patientRow.id))
        .orderBy(desc(appointment.scheduledAt));
    } catch (error) {
      const err = error as { code?: string };
      if (err.code === '42P01') {
        return [];
      }
      throw error;
    }

    return rows.map((row) => ({
      id: row.id,
      confirmationCode: row.confirmationCode,
      scheduledAt: row.scheduledAt.toISOString(),
      department: row.doctorSpecialty ?? 'Cardiology',
      clinician: row.doctorName,
      location:
        row.visitType === 'virtual'
          ? 'Virtual Consultation'
          : 'ICARE-CVD Main Center',
      status: row.status,
      notes: row.notes ?? undefined,
      symptoms: row.symptoms ?? undefined,
      visitType: row.visitType,
      reason: row.reason ?? undefined,
    }));
  }

  async create(userId: number, dto: CreateAppointmentDto) {
    const patientRow = await this.getOrCreatePatientProfile(userId);
    const reason = dto.reason.trim();
    if (!reason) {
      throw new BadRequestException('Reason is required');
    }

    const doctorExists = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, dto.doctorId),
    });
    if (!doctorExists) {
      throw new NotFoundException('Doctor not found');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const alreadyBooked = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.doctorId, dto.doctorId),
        eq(appointment.scheduledAt, scheduledAt),
        ne(appointment.status, 'cancelled'),
      ),
    });
    if (alreadyBooked) {
      throw new BadRequestException('This slot is already booked');
    }

    const code = await this.generateConfirmationCode();
    const [created] = await this.db
      .insert(appointment)
      .values({
        confirmationCode: code,
        patientId: patientRow.id,
        doctorId: dto.doctorId,
        scheduledAt,
        visitType: dto.visitType,
        status: 'scheduled',
        reason,
        symptoms: dto.symptoms ?? null,
      })
      .returning();

    if (dto.attachments && dto.attachments.length > 0) {
      await this.db.insert(appointmentAttachment).values(
        dto.attachments.map((item) => ({
          appointmentId: created.id,
          documentId: item.documentId,
          category: item.category,
        })),
      );
    }

    return {
      id: created.id,
      confirmationCode: created.confirmationCode,
      scheduledAt: created.scheduledAt.toISOString(),
      status: created.status,
      visitType: created.visitType,
    };
  }

  async update(
    userId: number,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const patientRow = await this.getOrCreatePatientProfile(userId);

    const existing = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.id, appointmentId),
        eq(appointment.patientId, patientRow.id),
      ),
    });
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    const [updated] = await this.db
      .update(appointment)
      .set({
        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : existing.scheduledAt,
        status: dto.status ?? existing.status,
        visitType: dto.visitType ?? existing.visitType,
        notes: dto.notes ?? existing.notes,
        cancelledAt:
          dto.status === 'cancelled' ? new Date() : existing.cancelledAt,
        updatedAt: new Date(),
      })
      .where(eq(appointment.id, existing.id))
      .returning();

    return {
      id: updated.id,
      confirmationCode: updated.confirmationCode,
      scheduledAt: updated.scheduledAt.toISOString(),
      status: updated.status,
      visitType: updated.visitType,
      notes: updated.notes,
    };
  }

  async cancel(userId: number, appointmentId: string) {
    return this.update(userId, appointmentId, { status: 'cancelled' });
  }

  async findUpcomingByConfirmationCode(
    userId: number,
    confirmationCode: string,
  ) {
    const code = confirmationCode.trim().toUpperCase();
    const appts = await this.listPatientAppointments(userId);
    const match = appts.find(
      (a) =>
        a.confirmationCode.toUpperCase() === code &&
        a.status !== 'cancelled' &&
        new Date(a.scheduledAt) >= new Date(),
    );
    if (!match) {
      throw new NotFoundException(
        `No upcoming appointment found with code ${confirmationCode}`,
      );
    }
    return match;
  }

  async cancelAllUpcoming(userId: number) {
    const appts = await this.listPatientAppointments(userId);
    const upcoming = appts.filter(
      (a) =>
        a.status !== 'cancelled' && new Date(a.scheduledAt) >= new Date(),
    );
    if (upcoming.length === 0) {
      return { cancelledCount: 0, confirmationCodes: [] as string[] };
    }

    const codes: string[] = [];
    for (const appt of upcoming) {
      const result = await this.cancel(userId, appt.id);
      codes.push(result.confirmationCode);
    }
    return { cancelledCount: codes.length, confirmationCodes: codes };
  }

  async rescheduleByConfirmationCode(
    userId: number,
    confirmationCode: string,
    scheduledAt: string,
  ) {
    const existing = await this.findUpcomingByConfirmationCode(
      userId,
      confirmationCode,
    );
    const newDate = new Date(scheduledAt);
    if (Number.isNaN(newDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }

    const row = await this.db.query.appointment.findFirst({
      where: eq(appointment.id, existing.id),
      columns: { doctorId: true },
    });
    if (!row) {
      throw new NotFoundException('Appointment not found');
    }

    const taken = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.doctorId, row.doctorId),
        eq(appointment.scheduledAt, newDate),
        ne(appointment.status, 'cancelled'),
        ne(appointment.id, existing.id),
      ),
    });
    if (taken) {
      throw new BadRequestException('This slot is already booked');
    }

    return this.update(userId, existing.id, { scheduledAt });
  }

  async changeVisitTypeByConfirmationCode(
    userId: number,
    confirmationCode: string,
    visitType: 'clinic' | 'virtual',
  ) {
    const existing = await this.findUpcomingByConfirmationCode(
      userId,
      confirmationCode,
    );
    return this.update(userId, existing.id, { visitType });
  }

  private async generateConfirmationCode() {
    for (let i = 0; i < 10; i += 1) {
      const candidate = `ICV-${randomInt(1000, 10000)}`;
      const exists = await this.db.query.appointment.findFirst({
        where: eq(appointment.confirmationCode, candidate),
      });
      if (!exists) return candidate;
    }
    throw new BadRequestException('Unable to generate confirmation code');
  }

  private async getOrCreatePatientProfile(userId: number) {
    const existing = await this.db.query.patient.findFirst({
      where: eq(patient.userId, userId),
    });
    if (existing) return existing;

    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    if (!userRow) {
      throw new NotFoundException('User not found');
    }
    if (userRow.role !== 'patient') {
      throw new ForbiddenException('Patient access required');
    }

    const [created] = await this.db
      .insert(patient)
      .values({
        userId,
        dateOfBirth: new Date('2000-01-01'),
        gender: 'other',
      })
      .returning();

    return created;
  }

  private generateSlots(
    periods: Array<{ startTime: string; endTime: string }>,
    unavailableBlocks: Array<{ startTime: string; endTime: string }>,
    slotDurationMinutes: number,
    bufferBetweenSlotsMinutes: number,
  ) {
    const slots: string[] = [];
    const step = slotDurationMinutes + bufferBetweenSlotsMinutes;
    for (const period of periods) {
      let cursor = this.hhmmToMinutes(period.startTime);
      const end = this.hhmmToMinutes(period.endTime);
      while (cursor + slotDurationMinutes <= end) {
        const slotEnd = cursor + slotDurationMinutes;
        const overlapsUnavailable = unavailableBlocks.some((b) => {
          const bStart = this.hhmmToMinutes(b.startTime);
          const bEnd = this.hhmmToMinutes(b.endTime);
          return cursor < bEnd && slotEnd > bStart;
        });
        if (!overlapsUnavailable) {
          slots.push(this.minutesToHHMM(cursor));
        }
        cursor += step;
      }
    }
    return slots;
  }

  private hhmmToMinutes(value: string) {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToHHMM(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private toAmPm(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  private toHHMM(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.clinicTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
  }

  private parseDateOnly(value: string) {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid from date');
    }
    return parsed;
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private toDateOnly(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.clinicTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return `${y}-${m}-${d}`;
  }

  private weekdayId(date: Date) {
    const map = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    return map[date.getDay()];
  }

  private weekdayLabelShort(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  private getMonthLabel(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
