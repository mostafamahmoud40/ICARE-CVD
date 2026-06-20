import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, ne } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, user } from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { UpdateDoctorAppointmentDto } from './dto/doctor-appointment.dto';
import { AppointmentService } from './appointment.service';
import { AppointmentPatientNotificationService } from './appointment-patient-notification.service';

export type AppointmentFilter =
  | 'all'
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'cancelled';

@Injectable()
export class DoctorAppointmentService {
  private readonly clinicTimeZone = 'Africa/Cairo';

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly appointmentService: AppointmentService,
    private readonly appointmentPatientNotifications: AppointmentPatientNotificationService,
  ) {}

  async getStats(doctorUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const todayStart = this.startOfDay(new Date());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [todayRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorRow.id),
          gte(appointment.scheduledAt, todayStart),
          lt(appointment.scheduledAt, todayEnd),
          ne(appointment.status, 'cancelled'),
        ),
      );

    const [upcomingRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorRow.id),
          gte(appointment.scheduledAt, new Date()),
          ne(appointment.status, 'cancelled'),
          ne(appointment.status, 'completed'),
        ),
      );

    const [completedRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorRow.id),
          eq(appointment.status, 'completed'),
        ),
      );

    const [cancelledRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorRow.id),
          eq(appointment.status, 'cancelled'),
        ),
      );

    return {
      today: todayRow.count,
      upcoming: upcomingRow.count,
      completed: completedRow.count,
      cancelled: cancelledRow.count,
    };
  }

  async listAppointments(
    doctorUserId: number,
    filter: AppointmentFilter = 'all',
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const conditions = [eq(appointment.doctorId, doctorRow.id)];

    if (filter === 'today') {
      const todayStart = this.startOfDay(new Date());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);
      conditions.push(gte(appointment.scheduledAt, todayStart));
      conditions.push(lt(appointment.scheduledAt, todayEnd));
      conditions.push(ne(appointment.status, 'cancelled'));
    } else if (filter === 'upcoming') {
      conditions.push(gte(appointment.scheduledAt, new Date()));
      conditions.push(ne(appointment.status, 'cancelled'));
      conditions.push(ne(appointment.status, 'completed'));
    } else if (filter === 'completed') {
      conditions.push(eq(appointment.status, 'completed'));
    } else if (filter === 'cancelled') {
      conditions.push(eq(appointment.status, 'cancelled'));
    }

    const rows = await this.db
      .select({
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        patientId: patient.id,
        patientName: user.name,
        patientAvatar: patient.avatarUrl,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        department: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .where(and(...conditions))
      .orderBy(desc(appointment.scheduledAt));

    return rows.map((row) => ({
      id: row.id,
      confirmationCode: row.confirmationCode,
      scheduledAt: row.scheduledAt.toISOString(),
      visitType: row.visitType,
      status: row.status,
      reason: row.reason,
      notes: row.notes,
      department: row.department ?? 'Cardiology',
      patient: {
        id: row.patientId,
        name: row.patientName,
        avatar: row.patientAvatar,
        age: this.computeAge(row.patientDateOfBirth),
        gender: row.patientGender,
      },
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getAppointment(doctorUserId: number, appointmentId: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const row = await this.db
      .select({
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
        reason: appointment.reason,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        patientId: patient.id,
        patientName: user.name,
        patientAvatar: patient.avatarUrl,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        department: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .where(
        and(
          eq(appointment.id, appointmentId),
          eq(appointment.doctorId, doctorRow.id),
        ),
      )
      .limit(1);

    if (!row.length) {
      throw new NotFoundException('Appointment not found');
    }

    const a = row[0];
    return {
      id: a.id,
      confirmationCode: a.confirmationCode,
      scheduledAt: a.scheduledAt.toISOString(),
      visitType: a.visitType,
      status: a.status,
      reason: a.reason,
      symptoms: a.symptoms,
      notes: a.notes,
      department: a.department ?? 'Cardiology',
      cancelledAt: a.cancelledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      patient: {
        id: a.patientId,
        name: a.patientName,
        avatar: a.patientAvatar,
        age: this.computeAge(a.patientDateOfBirth),
        gender: a.patientGender,
      },
    };
  }

  async updateAppointment(
    doctorUserId: number,
    appointmentId: string,
    dto: UpdateDoctorAppointmentDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.id, appointmentId),
        eq(appointment.doctorId, doctorRow.id),
      ),
    });
    if (!existing) throw new NotFoundException('Appointment not found');

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.scheduledAt !== undefined) {
      if (existing.status === 'cancelled') {
        throw new BadRequestException(
          'Cannot reschedule a cancelled appointment',
        );
      }

      const nextScheduledAt = new Date(dto.scheduledAt);
      if (Number.isNaN(nextScheduledAt.getTime())) {
        throw new BadRequestException('Invalid scheduledAt');
      }

      const requestedDate = this.toDateOnly(nextScheduledAt);
      const requestedTime = this.toHHMM(nextScheduledAt);
      const availability = await this.appointmentService.getDoctorAvailability(
        doctorRow.id,
        requestedDate,
        1,
      );
      const slotsForDate = availability.timeSlotsByDate[requestedDate] ?? [];
      const isAvailable = slotsForDate.some((slot) => {
        if (slot.label === 'Booked') {
          return (
            this.fromAmPmToHHMM(slot.time) === requestedTime &&
            this.toDateOnly(existing.scheduledAt) === requestedDate &&
            this.toHHMM(existing.scheduledAt) === requestedTime
          );
        }
        return this.fromAmPmToHHMM(slot.time) === requestedTime;
      });
      if (!isAvailable) {
        throw new BadRequestException('This slot is not available');
      }

      const dayStart = new Date(`${requestedDate}T00:00:00`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const queryStart = new Date(dayStart);
      queryStart.setDate(queryStart.getDate() - 1);
      const queryEnd = new Date(dayEnd);
      queryEnd.setDate(queryEnd.getDate() + 1);
      const sameDayAppointments = await this.db.query.appointment.findMany({
        where: and(
          eq(appointment.doctorId, doctorRow.id),
          gte(appointment.scheduledAt, queryStart),
          lt(appointment.scheduledAt, queryEnd),
          ne(appointment.status, 'cancelled'),
        ),
      });
      const hasExactConflict = sameDayAppointments.some(
        (item) =>
          item.id !== appointmentId &&
          this.toDateOnly(item.scheduledAt) === requestedDate &&
          this.toHHMM(item.scheduledAt) === requestedTime,
      );
      if (hasExactConflict) {
        throw new BadRequestException('This slot is already booked');
      }

      updates.scheduledAt = nextScheduledAt;
    }

    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.reason !== undefined) updates.reason = dto.reason;

    if (dto.status === 'cancelled') {
      updates.cancelledAt = new Date();
    }

    if (dto.status === 'completed') {
      updates.completedAt = new Date();
    }

    const [updated] = await this.db
      .update(appointment)
      .set(updates)
      .where(eq(appointment.id, appointmentId))
      .returning();

    void this.appointmentPatientNotifications
      .notifyAfterUpdate(existing, updated)
      .catch(() => undefined);

    return {
      id: updated.id,
      confirmationCode: updated.confirmationCode,
      scheduledAt: updated.scheduledAt.toISOString(),
      status: updated.status,
      visitType: updated.visitType,
      notes: updated.notes,
      reason: updated.reason,
    };
  }

  async cancelAppointment(doctorUserId: number, appointmentId: string) {
    return this.updateAppointment(doctorUserId, appointmentId, {
      status: 'cancelled',
    });
  }

  async completeAppointment(doctorUserId: number, appointmentId: string) {
    return this.updateAppointment(doctorUserId, appointmentId, {
      status: 'completed',
    });
  }

  async getAvailableSlots(
    doctorUserId: number,
    date: string,
    excludeAppointmentId?: string,
  ) {
    if (!date) {
      throw new BadRequestException('date is required');
    }

    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    let excludeTime: string | null = null;

    if (excludeAppointmentId) {
      const excluded = await this.db.query.appointment.findFirst({
        where: and(
          eq(appointment.id, excludeAppointmentId),
          eq(appointment.doctorId, doctorRow.id),
        ),
      });
      if (excluded && this.toDateOnly(excluded.scheduledAt) === date) {
        excludeTime = this.toHHMM(excluded.scheduledAt);
      }
    }

    const availability = await this.appointmentService.getDoctorAvailability(
      doctorRow.id,
      date,
      1,
    );
    const slotsForDate = availability.timeSlotsByDate[date] ?? [];
    const slots = slotsForDate
      .filter((slot) => {
        if (slot.label === 'Booked') {
          return excludeTime === this.fromAmPmToHHMM(slot.time);
        }
        return true;
      })
      .map((slot) => ({
        value: this.fromAmPmToHHMM(slot.time),
        label: slot.time,
      }));

    return { date, slots };
  }

  private startOfDay(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.clinicTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
    const m = parts.find((p) => p.type === 'month')?.value ?? '01';
    const d = parts.find((p) => p.type === 'day')?.value ?? '01';
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
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

  private fromAmPmToHHMM(time: string) {
    const [rawTime, rawPeriod] = time.trim().split(' ');
    const [rawHour, rawMinute] = rawTime.split(':').map(Number);
    const period = rawPeriod?.toUpperCase();
    let hour = rawHour;
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')}`;
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

  private computeAge(dob: Date | null): number | null {
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  }
}
