import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  count,
  desc,
  eq,
} from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  doctor,
  patient,
  user,
} from '../../database/schema';
import type { CreateAssistantAppointmentDto } from './dto/create-appointment.dto';

type DoctorRow = { id: string; name: string; specialty: string | null };

@Injectable()
export class AssistantAppointmentService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

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
    const rows = await this.db
      .select({
        id: appointment.id,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        visitType: appointment.visitType,
        status: appointment.status,
        reason: appointment.reason,
        createdAt: appointment.createdAt,
        patientName: user.name,
        patientPhone: user.phone,
        patientEmail: user.email,
        doctorId: doctor.id,
        doctorSpecialty: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .orderBy(desc(appointment.scheduledAt));

    const doctorIdSet = new Set(rows.map((r) => r.doctorId));
    const doctorNames = await this.batchDoctorNames([...doctorIdSet]);

    return rows.map((row) => ({
      id: row.id,
      patientName: row.patientName,
      patientPhone: row.patientPhone,
      patientEmail: row.patientEmail,
      doctorName: doctorNames.get(row.doctorId) ?? 'Unknown',
      department: row.doctorSpecialty ?? 'Cardiology',
      scheduledAt: row.scheduledAt.toISOString(),
      visitType: row.visitType,
      reason: row.reason,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getAppointment(appointmentId: string) {
    const rows = await this.db
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
        patientName: user.name,
        patientPhone: user.phone,
        patientEmail: user.email,
        doctorId: doctor.id,
        doctorSpecialty: doctor.specialty,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .where(eq(appointment.id, appointmentId))
      .limit(1);

    if (!rows.length) throw new NotFoundException('Appointment not found');

    const a = rows[0];
    const doctorNames = await this.batchDoctorNames([a.doctorId]);

    return {
      id: a.id,
      confirmationCode: a.confirmationCode,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      patientEmail: a.patientEmail,
      doctorName: doctorNames.get(a.doctorId) ?? 'Unknown',
      department: a.doctorSpecialty ?? 'Cardiology',
      scheduledAt: a.scheduledAt.toISOString(),
      visitType: a.visitType,
      reason: a.reason,
      symptoms: a.symptoms,
      notes: a.notes,
      status: a.status,
      cancelledAt: a.cancelledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    };
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

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async createAppointment(dto: CreateAssistantAppointmentDto) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, dto.patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.id, dto.doctorId),
    });
    if (!doctorRow) throw new NotFoundException('Doctor not found');

    const code = await this.generateConfirmationCode();

    const [created] = await this.db
      .insert(appointment)
      .values({
        confirmationCode: code,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
        visitType: dto.visitType,
        status: 'scheduled',
        reason: dto.reason,
        symptoms: dto.symptoms ?? null,
      })
      .returning();

    return this.getAppointment(created.id);
  }

  async listDoctors(): Promise<DoctorRow[]> {
    return this.db
      .select({
        id: doctor.id,
        name: user.name,
        specialty: doctor.specialty,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(user.role, 'doctor'));
  }

  async listPatients() {
    return this.db
      .select({
        id: patient.id,
        name: user.name,
        phone: user.phone,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(eq(user.role, 'patient'));
  }

  private async batchDoctorNames(doctorIds: string[]): Promise<Map<string, string>> {
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
}
