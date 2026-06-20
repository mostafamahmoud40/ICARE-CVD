import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, ne } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, patientQueue, user } from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';
import type {
  CreateDoctorAppointmentDto,
  UpdateDoctorAppointmentDto,
} from './dto/doctor-appointment.dto';
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
    private readonly avatarUrlResolver: AvatarUrlResolver,
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
    await this.appointmentService.autoMarkStaleNoShows(doctorRow.id);

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
        queueId: patientQueue.id,
        queueStatus: patientQueue.status,
        patientUuid: patient.id,
        patientNumber: patient.patientNumber,
        patientName: user.name,
        patientAvatar: patient.avatarUrl,
        patientUserAvatar: user.avatarUrl,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        department: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .leftJoin(patientQueue, eq(patientQueue.appointmentId, appointment.id))
      .where(and(...conditions))
      .orderBy(desc(appointment.scheduledAt));

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        confirmationCode: row.confirmationCode,
        scheduledAt: row.scheduledAt.toISOString(),
        visitType: row.visitType,
        status: row.status,
        reason: row.reason,
        notes: row.notes,
        department: row.department ?? 'Cardiology',
      patient: {
        id: row.patientNumber,
        name: row.patientName,
          avatar: await this.resolvePatientAvatar(
            row.patientAvatar,
            row.patientUserAvatar,
          ),
          age: this.computeAge(row.patientDateOfBirth),
          gender: row.patientGender,
        },
        cancelledAt: row.cancelledAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        queueId: row.queueId ?? null,
        queueStatus: row.queueStatus ?? null,
      })),
    );
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
        queueId: patientQueue.id,
        queueStatus: patientQueue.status,
        patientUuid: patient.id,
        patientNumber: patient.patientNumber,
        patientName: user.name,
        patientAvatar: patient.avatarUrl,
        patientUserAvatar: user.avatarUrl,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        department: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .leftJoin(patientQueue, eq(patientQueue.appointmentId, appointment.id))
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
      queueId: a.queueId ?? null,
      queueStatus: a.queueStatus ?? null,
      patient: {
        id: a.patientNumber,
        name: a.patientName,
        avatar: await this.resolvePatientAvatar(
          a.patientAvatar,
          a.patientUserAvatar,
        ),
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
    const result = await this.updateAppointment(doctorUserId, appointmentId, {
      status: 'cancelled',
    });
    await this.syncQueueStatusForAppointment(appointmentId, 'cancelled');
    return result;
  }

  async completeAppointment(doctorUserId: number, appointmentId: string) {
    const result = await this.updateAppointment(doctorUserId, appointmentId, {
      status: 'completed',
    });
    await this.syncQueueStatusForAppointment(appointmentId, 'completed');
    return result;
  }

  async markNoShow(doctorUserId: number, appointmentId: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const appt = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.id, appointmentId),
        eq(appointment.doctorId, doctorRow.id),
      ),
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.status === 'cancelled' || appt.status === 'completed') {
      throw new BadRequestException('Cannot mark a closed appointment as no-show');
    }

    const now = new Date();
    const existingQueue = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.appointmentId, appointmentId),
    });

    if (existingQueue) {
      await this.db
        .update(patientQueue)
        .set({ status: 'no-show', updatedAt: now })
        .where(eq(patientQueue.id, existingQueue.id));
    } else {
      await this.db.insert(patientQueue).values({
        appointmentId,
        status: 'no-show',
        priority: 'normal',
        updatedAt: now,
      });
    }

    return this.getAppointment(doctorUserId, appointmentId);
  }

  async createAppointment(
    doctorUserId: number,
    dto: CreateDoctorAppointmentDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await findPatientByIdentifier(this.db, dto.patientId);

    const requestedAt = new Date(dto.scheduledAt);
    if (Number.isNaN(requestedAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    if (requestedAt.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book a slot in the past');
    }

    const requestedDate = this.toDateOnly(requestedAt);
    const requestedTime = this.toHHMM(requestedAt);
    const availability = await this.appointmentService.getDoctorAvailability(
      doctorRow.id,
      requestedDate,
      1,
    );
    const slotsForDate = availability.timeSlotsByDate[requestedDate] ?? [];
    const isAvailable = slotsForDate.some(
      (slot) =>
        slot.label !== 'Booked' &&
        this.fromAmPmToHHMM(slot.time) === requestedTime,
    );
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
        this.toDateOnly(item.scheduledAt) === requestedDate &&
        this.toHHMM(item.scheduledAt) === requestedTime,
    );
    if (hasExactConflict) {
      throw new BadRequestException('This slot is already booked');
    }

    const code = await this.generateConfirmationCode();

    const [created] = await this.db
      .insert(appointment)
      .values({
        confirmationCode: code,
        patientId: patientRow.id,
        doctorId: doctorRow.id,
        scheduledAt: requestedAt,
        visitType: dto.visitType,
        status: 'scheduled',
        reason: dto.reason,
        symptoms: dto.symptoms ?? null,
        notes: dto.notes ?? null,
      })
      .returning();

    void this.appointmentPatientNotifications
      .notifyBooked(created.id, { bookedBy: 'clinic' })
      .catch(() => undefined);

    return this.getAppointment(doctorUserId, created.id);
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

  private async syncQueueStatusForAppointment(
    appointmentId: string,
    status: 'completed' | 'cancelled',
  ) {
    const queue = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.appointmentId, appointmentId),
    });
    if (!queue) return;

    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (status === 'completed') updates.completedAt = now;

    await this.db
      .update(patientQueue)
      .set(updates)
      .where(eq(patientQueue.id, queue.id));
  }

  private async resolvePatientAvatar(
    primary: string | null | undefined,
    fallback: string | null | undefined,
  ): Promise<string | null> {
    const raw = primary?.trim() || fallback?.trim() || null;
    if (!raw) return null;
    return this.avatarUrlResolver.resolve(raw);
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

  private async generateConfirmationCode() {
    const { randomInt } = await import('crypto');
    for (let i = 0; i < 10; i += 1) {
      const candidate = `ICV-${randomInt(1000, 10000)}`;
      const exists = await this.db.query.appointment.findFirst({
        where: eq(appointment.confirmationCode, candidate),
      });
      if (!exists) return candidate;
    }
    throw new Error('Unable to generate confirmation code');
  }
}
