import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { count, desc, eq, gte, lt, ne, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, patientQueue, user } from '../../database/schema';
import type {
  CreateAssistantAppointmentDto,
  PatchAssistantAppointmentDto,
} from './dto/create-appointment.dto';
import { AppointmentService } from '../appointment/appointment.service';
import { AppointmentPatientNotificationService } from '../appointment/appointment-patient-notification.service';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';

type DoctorRow = { id: string; name: string; specialty: string | null; avatarUrl: string | null };

const doctorUser = alias(user, 'doctor_user');

@Injectable()
export class AssistantAppointmentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly appointmentService: AppointmentService,
    private readonly appointmentPatientNotifications: AppointmentPatientNotificationService,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async getStats() {
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(appointment);

    const [scheduledRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, 'scheduled'));

    const [confirmedRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, 'confirmed'));

    const [completedRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, 'completed'));

    const [cancelledRow] = await this.db
      .select({ count: count() })
      .from(appointment)
      .where(eq(appointment.status, 'cancelled'));

    return {
      total: totalRow.count,
      scheduled: scheduledRow.count,
      confirmed: confirmedRow.count,
      completed: completedRow.count,
      cancelled: cancelledRow.count,
    };
  }

  async listAppointments() {
    await this.appointmentService.autoMarkStaleNoShows();

    const rows = await this.db
      .select({
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        patientId: appointment.patientId,
        patientNumber: patient.patientNumber,
        patientName: user.name,
        patientPhone: user.phone,
        patientEmail: user.email,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        patientAvatarUrl: patient.avatarUrl,
        patientUserAvatarUrl: user.avatarUrl,
        doctorId: doctor.id,
        doctorSpecialty: doctor.specialty,
        doctorAvatarUrl: doctorUser.avatarUrl,
        queueId: patientQueue.id,
        queueStatus: patientQueue.status,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .innerJoin(doctorUser, eq(doctor.userId, doctorUser.id))
      .leftJoin(patientQueue, eq(patientQueue.appointmentId, appointment.id))
      .orderBy(desc(appointment.scheduledAt));

    const doctorIdSet = new Set(rows.map((r) => r.doctorId));
    const doctorNames = await this.batchDoctorNames([...doctorIdSet]);

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        confirmationCode: row.confirmationCode,
        patientId: row.patientNumber,
        patientName: row.patientName,
        patientPhone: row.patientPhone,
        patientEmail: row.patientEmail,
        patientAge: this.computeAge(row.patientDateOfBirth),
        patientGender: row.patientGender,
        patientAvatarUrl: await this.resolveStoredAvatarUrl(
          row.patientAvatarUrl,
          row.patientUserAvatarUrl,
        ),
        doctorId: row.doctorId,
        doctorName: doctorNames.get(row.doctorId) ?? 'Unknown',
        doctorAvatarUrl: await this.resolveStoredAvatarUrl(
          row.doctorAvatarUrl,
          null,
        ),
        department: row.doctorSpecialty ?? 'Cardiology',
        scheduledAt: row.scheduledAt.toISOString(),
        visitType: row.visitType,
        reason: row.reason,
        notes: row.notes ?? null,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        queueId: row.queueId ?? null,
        queueStatus: row.queueStatus ?? null,
      })),
    );
  }

  async getAppointment(appointmentId: string) {
    const rows = await this.db
      .select({
        id: appointment.id,
        patientUuid: appointment.patientId,
        patientNumber: patient.patientNumber,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
        reason: appointment.reason,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        patientName: user.name,
        patientPhone: user.phone,
        patientEmail: user.email,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        patientAvatarUrl: patient.avatarUrl,
        patientUserAvatarUrl: user.avatarUrl,
        doctorId: doctor.id,
        doctorSpecialty: doctor.specialty,
        doctorAvatarUrl: doctorUser.avatarUrl,
        queueId: patientQueue.id,
        queueStatus: patientQueue.status,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .innerJoin(doctorUser, eq(doctor.userId, doctorUser.id))
      .leftJoin(patientQueue, eq(patientQueue.appointmentId, appointment.id))
      .where(eq(appointment.id, appointmentId))
      .limit(1);

    if (!rows.length) throw new NotFoundException('Appointment not found');

    const a = rows[0];
    const doctorNames = await this.batchDoctorNames([a.doctorId]);

    return {
      id: a.id,
      patientId: a.patientNumber,
      doctorId: a.doctorId,
      confirmationCode: a.confirmationCode,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      patientEmail: a.patientEmail,
      patientAge: this.computeAge(a.patientDateOfBirth),
      patientGender: a.patientGender,
      patientAvatarUrl: await this.resolveStoredAvatarUrl(
        a.patientAvatarUrl,
        a.patientUserAvatarUrl,
      ),
      doctorName: doctorNames.get(a.doctorId) ?? 'Unknown',
      doctorAvatarUrl: await this.resolveStoredAvatarUrl(a.doctorAvatarUrl, null),
      department: a.doctorSpecialty ?? 'Cardiology',
      scheduledAt: a.scheduledAt.toISOString(),
      visitType: a.visitType,
      reason: a.reason,
      symptoms: a.symptoms,
      notes: a.notes,
      status: a.status,
      cancelledAt: a.cancelledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      queueId: a.queueId ?? null,
      queueStatus: a.queueStatus ?? null,
    };
  }

  async patchAppointment(
    appointmentId: string,
    dto: PatchAssistantAppointmentDto,
  ) {
    const existing = await this.db.query.appointment.findFirst({
      where: eq(appointment.id, appointmentId),
    });
    if (!existing) throw new NotFoundException('Appointment not found');

    const hasAny =
      dto.scheduledAt !== undefined ||
      dto.doctorId !== undefined ||
      dto.visitType !== undefined ||
      dto.reason !== undefined ||
      dto.notes !== undefined;
    if (!hasAny) {
      throw new BadRequestException('No fields to update');
    }

    const nextDoctorId = dto.doctorId ?? existing.doctorId;
    const nextScheduledAt =
      dto.scheduledAt !== undefined
        ? new Date(dto.scheduledAt)
        : existing.scheduledAt;

    const schedulingChanged =
      dto.scheduledAt !== undefined || dto.doctorId !== undefined;

    if (schedulingChanged && existing.status === 'cancelled') {
      throw new BadRequestException(
        'Cannot reschedule or reassign a cancelled appointment',
      );
    }

    if (schedulingChanged) {
      if (Number.isNaN(nextScheduledAt.getTime())) {
        throw new BadRequestException('Invalid scheduledAt');
      }
      const requestedDate = this.toDateOnly(nextScheduledAt);
      const requestedTime = this.toHHMM(nextScheduledAt);
      const availability = await this.getAvailableSlots(
        nextDoctorId,
        requestedDate,
      );
      const isAvailable = availability.slots.some(
        (slot) => slot.value === requestedTime,
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
          eq(appointment.doctorId, nextDoctorId),
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
    }

    if (dto.doctorId !== undefined) {
      const doctorRow = await this.db.query.doctor.findFirst({
        where: eq(doctor.id, dto.doctorId),
      });
      if (!doctorRow) throw new NotFoundException('Doctor not found');
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (dto.scheduledAt !== undefined)
      updates.scheduledAt = nextScheduledAt;
    if (dto.doctorId !== undefined) updates.doctorId = nextDoctorId;
    if (dto.visitType !== undefined) updates.visitType = dto.visitType;
    if (dto.reason !== undefined) updates.reason = dto.reason;
    if (dto.notes !== undefined)
      updates.notes = dto.notes.trim() === '' ? null : dto.notes;

    await this.db
      .update(appointment)
      .set(updates)
      .where(eq(appointment.id, appointmentId));

    if (schedulingChanged) {
      void this.appointmentPatientNotifications
        .notifyAfterUpdate(existing, {
          ...existing,
          scheduledAt: nextScheduledAt,
          doctorId: nextDoctorId,
        })
        .catch(() => undefined);
    }

    return this.getAppointment(appointmentId);
  }

  async updateStatus(appointmentId: string, status: string) {
    const existing = await this.db.query.appointment.findFirst({
      where: eq(appointment.id, appointmentId),
    });
    if (!existing) throw new NotFoundException('Appointment not found');

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'cancelled') {
      updates.cancelledAt = new Date();
    }

    if (status === 'completed') {
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
      status: updated.status,
    };
  }

  async createAppointment(dto: CreateAssistantAppointmentDto) {
    const patientRow = await findPatientByIdentifier(this.db, dto.patientId);

    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, dto.doctorId),
    });
    if (!doctorRow) throw new NotFoundException('Doctor not found');

    const requestedAt = new Date(dto.scheduledAt);
    if (Number.isNaN(requestedAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }
    if (requestedAt.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot book a slot in the past');
    }
    const requestedDate = this.toDateOnly(requestedAt);
    const requestedTime = this.toHHMM(requestedAt);
    const availability = await this.getAvailableSlots(
      dto.doctorId,
      requestedDate,
    );
    const isAvailable = availability.slots.some(
      (slot) => slot.value === requestedTime,
    );
    if (!isAvailable) {
      throw new BadRequestException('This slot is not available');
    }

    // Hard conflict check in DB to avoid any race condition/cache drift.
    const dayStart = new Date(`${requestedDate}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const queryStart = new Date(dayStart);
    queryStart.setDate(queryStart.getDate() - 1);
    const queryEnd = new Date(dayEnd);
    queryEnd.setDate(queryEnd.getDate() + 1);
    const sameDayAppointments = await this.db.query.appointment.findMany({
      where: and(
        eq(appointment.doctorId, dto.doctorId),
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
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
        visitType: dto.visitType,
        status: 'scheduled',
        reason: dto.reason,
        symptoms: dto.symptoms ?? null,
      })
      .returning();

    void this.appointmentPatientNotifications
      .notifyBooked(created.id, { bookedBy: 'clinic' })
      .catch(() => undefined);

    return this.getAppointment(created.id);
  }

  async getAvailableSlots(doctorId: string, date: string) {
    if (!doctorId || !date) {
      throw new BadRequestException('doctorId and date are required');
    }
    const availability = await this.appointmentService.getDoctorAvailability(
      doctorId,
      date,
      1,
    );
    const slotsForDate = availability.timeSlotsByDate[date] ?? [];
    const slots = slotsForDate
      .filter((slot) => slot.label !== 'Booked')
      .map((slot) => ({
        value: this.fromAmPmToHHMM(slot.time),
        label: slot.time,
      }));

    return { date, slots };
  }

  async listDoctors(): Promise<DoctorRow[]> {
    const rows = await this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
        avatarUrl: user.avatarUrl,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(user.role, 'doctor'));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      avatarUrl: row.avatarUrl?.trim() ? row.avatarUrl.trim() : null,
    }));
  }

  async listPatients() {
    const rows = await this.db
      .select({
        id: patient.patientNumber,
        name: user.name,
        phone: user.phone,
        patientAvatarUrl: patient.avatarUrl,
        patientNumber: patient.patientNumber,
        userAvatarUrl: user.avatarUrl,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(eq(user.role, 'patient'));

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        avatarUrl: await this.resolveStoredAvatarUrl(
          row.patientAvatarUrl,
          row.userAvatarUrl,
        ),
      })),
    );
  }

  private async resolveStoredAvatarUrl(
    primary: string | null | undefined,
    fallback: string | null | undefined,
  ): Promise<string | null> {
    const raw = primary?.trim() || fallback?.trim() || null;
    if (!raw) return null;
    return this.avatarUrlResolver.resolve(raw);
  }

  private async batchDoctorNames(
    doctorIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (doctorIds.length === 0) return map;

    for (const did of doctorIds) {
      const row = await this.db
        .select({ name: user.name })
        .from(doctor)
        .innerJoin(user, eq(doctor.userId, user.id))
        .where(eq(doctor.id, did))
        .limit(1);
      if (row[0]) map.set(did, row[0].name);
    }

    return map;
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

  private toDateOnly(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
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
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
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

  private fromAmPmToHHMM(time: string) {
    const [rawTime, rawPeriod] = time.trim().split(' ');
    const [rawHour, rawMinute] = rawTime.split(':').map(Number);
    const period = rawPeriod?.toUpperCase();
    let hour = rawHour;
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(rawMinute).padStart(
      2,
      '0',
    )}`;
  }
}
