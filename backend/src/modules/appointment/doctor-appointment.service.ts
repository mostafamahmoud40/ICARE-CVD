import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, lt, ne } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, user } from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type { UpdateDoctorAppointmentDto } from './dto/doctor-appointment.dto';

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
      ...dto,
      updatedAt: new Date(),
    };

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
