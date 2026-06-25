import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { notifyPatientDataChanged } from '../../shared/patient-data-notifier';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  medication,
  doseLog,
  patient,
  user,
  doctor,
} from '../../database/schema';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/medication.dto';

@Injectable()
export class MedicationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly avatarUrlResolver: AvatarUrlResolver,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ===================== PATIENT ENDPOINTS =====================

  /** List all medications for the authenticated patient. */
  async listPatientMedications(userId: number) {
    const rows = await this.db
      .select({
        id: medication.id,
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        type: medication.type,
        compliance: medication.compliance,
        sideEffects: medication.sideEffects,
        status: medication.status,
        instructions: medication.instructions,
        timeOfDay: medication.timeOfDay,
        adherencePercent: medication.adherencePercent,
        startDate: medication.startDate,
        durationDays: medication.durationDays,
        endDate: medication.endDate,
        prescribedAt: medication.createdAt,
        createdAt: medication.createdAt,
        updatedAt: medication.updatedAt,
        doctorName: user.name,
      })
      .from(medication)
      .leftJoin(doctor, eq(medication.prescribedBy, doctor.id))
      .leftJoin(user, eq(doctor.userId, user.id))
      .where(
        and(eq(medication.userId, userId), isNotNull(medication.prescribedBy)),
      )
      .orderBy(desc(medication.createdAt));

    return rows.map((row) => ({
      ...row,
      prescribedBy: row.doctorName ?? null,
      doctorName: undefined,
    }));
  }

  /** Get a single medication for the authenticated patient. */
  async getPatientMedication(userId: number, medicationId: string) {
    const row = await this.db.query.medication.findFirst({
      where: and(
        eq(medication.id, medicationId),
        eq(medication.userId, userId),
        isNotNull(medication.prescribedBy),
      ),
    });

    if (!row) {
      throw new NotFoundException('Medication not found');
    }

    return row;
  }

  /** Get dose log for a patient's medication (last 30 days). */
  async getPatientDoseLog(userId: number, medicationId: string) {
    const med = await this.db.query.medication.findFirst({
      where: and(
        eq(medication.id, medicationId),
        eq(medication.userId, userId),
        isNotNull(medication.prescribedBy),
      ),
    });

    if (!med) {
      throw new NotFoundException('Medication not found');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.db.query.doseLog.findMany({
      where: and(
        eq(doseLog.medicationId, medicationId),
        sql`${doseLog.takenAt} >= ${thirtyDaysAgo.toISOString()}`,
      ),
      orderBy: desc(doseLog.takenAt),
    });
  }

  /** Adherence record for medication detail dialog (last 30 days). */
  async getMedicationAdherenceRecord(medicationId: string) {
    const med = await this.db.query.medication.findFirst({
      where: eq(medication.id, medicationId),
    });

    if (!med) {
      throw new NotFoundException('Medication not found');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await this.db.query.doseLog.findMany({
      where: and(
        eq(doseLog.medicationId, medicationId),
        sql`${doseLog.takenAt} >= ${thirtyDaysAgo.toISOString()}`,
      ),
      orderBy: desc(doseLog.takenAt),
    });

    return {
      medication: {
        id: med.id,
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        instructions: med.instructions,
        timeOfDay: med.timeOfDay ?? [],
        startDate: med.startDate ? String(med.startDate).slice(0, 10) : null,
        adherencePercent: med.adherencePercent,
      },
      doseLogs: logs.map((log) => ({
        id: log.id,
        takenAt:
          log.takenAt instanceof Date
            ? log.takenAt.toISOString()
            : String(log.takenAt),
        skipped: log.skipped,
      })),
    };
  }

  /** Patient marks a medication as taken or skipped. */
  async logDose(userId: number, medicationId: string, skipped: boolean) {
    const med = await this.db.query.medication.findFirst({
      where: and(
        eq(medication.id, medicationId),
        eq(medication.userId, userId),
        isNotNull(medication.prescribedBy),
      ),
    });

    if (!med) {
      throw new NotFoundException('Medication not found');
    }

    if (med.status !== 'active') {
      throw new BadRequestException('Cannot log dose for inactive medication');
    }

    const [log] = await this.db
      .insert(doseLog)
      .values({
        medicationId,
        patientId: userId,
        skipped,
      })
      .returning();

    // Update last taken and recalculate adherence
    await this.recalculateAdherence(medicationId);

    return log;
  }

  // ===================== DOCTOR ENDPOINTS =====================

  /** List all patients assigned to a doctor with medication counts. */
  async listDoctorPatients(doctorUserId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, doctorUserId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Get patients who have appointments with this doctor
    const patients = await this.db
      .select({
        id: patient.id,
        fullName: user.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        avatarUrl: patient.avatarUrl,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .orderBy(user.name);

    // Get medication counts per patient (grouped by userId = user.id)
    const medCounts = await this.db
      .select({
        userId: medication.userId,
        activeCount: sql<number>`count(*) filter (where ${medication.status} = 'active')`,
        poorComplianceCount: sql<number>`count(*) filter (where ${medication.compliance} = 'poor' and ${medication.status} = 'active')`,
      })
      .from(medication)
      .groupBy(medication.userId);

    // Map patient UUID -> userId (integer) for count lookup
    const patientUserMap = await this.db
      .select({ id: patient.id, userId: patient.userId })
      .from(patient);

    const uuidToUserId = new Map(patientUserMap.map((p) => [p.id, p.userId]));
    const countMap = new Map(medCounts.map((c) => [c.userId, c]));

    return Promise.all(
      patients.map(async (p) => {
        const userId = uuidToUserId.get(p.id);
        const counts = userId
          ? (countMap.get(userId) ?? { activeCount: 0, poorComplianceCount: 0 })
          : { activeCount: 0, poorComplianceCount: 0 };
        return {
          patientId: p.id,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth,
          gender: p.gender,
          avatarUrl: await this.avatarUrlResolver.resolve(p.avatarUrl),
          activeMedications: Number(counts.activeCount),
          poorComplianceCount: Number(counts.poorComplianceCount),
        };
      }),
    );
  }

  /** List all medications for a specific patient (doctor view). */
  async listPatientMedicationsForDoctor(
    doctorUserId: number,
    patientId: string,
  ) {
    await this.verifyDoctorExists(doctorUserId);

    // Resolve patient UUID to user ID
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });

    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }

    const patientUserId = patientRow.userId;

    const rows = await this.db
      .select({
        id: medication.id,
        patientId: patient.id,
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        type: medication.type,
        compliance: medication.compliance,
        sideEffects: medication.sideEffects,
        status: medication.status,
        instructions: medication.instructions,
        timeOfDay: medication.timeOfDay,
        adherencePercent: medication.adherencePercent,
        startDate: medication.startDate,
        durationDays: medication.durationDays,
        endDate: medication.endDate,
        prescribedAt: medication.createdAt,
        lastTakenAt: sql<string | null>`(
          select ${doseLog.takenAt} from ${doseLog}
          where ${doseLog.medicationId} = ${medication.id} and ${doseLog.skipped} = false
          order by ${doseLog.takenAt} desc limit 1
        )`,
        createdAt: medication.createdAt,
        updatedAt: medication.updatedAt,
      })
      .from(medication)
      .innerJoin(patient, eq(medication.userId, patient.userId))
      .where(eq(medication.userId, patientUserId))
      .orderBy(desc(medication.status), desc(medication.createdAt));

    return rows;
  }

  /** Doctor prescribes a new medication for a patient. */
  async createMedicationForPatient(
    doctorUserId: number,
    patientId: string,
    dto: CreateMedicationDto,
  ) {
    const doctorRow = await this.verifyDoctorExists(doctorUserId);

    // Resolve patient UUID to user ID
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });

    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }

    const patientUserId = patientRow.userId;

    const [newMed] = await this.db
      .insert(medication)
      .values({
        userId: patientUserId,
        name: dto.name,
        dose: dto.dose,
        frequency: dto.frequency,
        type: dto.type,
        sideEffects: dto.sideEffects,
        instructions: dto.instructions,
        timeOfDay: dto.timeOfDay ?? ['morning'],
        prescribedBy: doctorRow.id,
        status: 'active',
        compliance: 'good',
        adherencePercent: 100,
        startDate: dto.startDate ?? new Date().toISOString().split('T')[0],
        durationDays: dto.durationDays ?? null,
      })
      .returning();

    const [doctorUser] = await this.db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, doctorUserId))
      .limit(1);

    void this.notificationsService
      .dispatch({
        userId: patientUserId,
        kind: 'prescription',
        title: 'New prescription',
        body: `Dr. ${doctorUser?.name ?? 'Your doctor'} prescribed ${newMed.name} ${newMed.dose}.`,
        href: '/medications',
        metadata: { medicationId: newMed.id, patientId },
      })
      .catch(() => undefined);

    notifyPatientDataChanged(patientId, 'medication');

    return newMed;
  }

  /** Doctor updates a medication. */
  async updateMedication(
    doctorUserId: number,
    medicationId: string,
    dto: UpdateMedicationDto,
  ) {
    await this.verifyDoctorExists(doctorUserId);

    const existing = await this.db.query.medication.findFirst({
      where: eq(medication.id, medicationId),
    });

    if (!existing) {
      throw new NotFoundException('Medication not found');
    }

    const [updated] = await this.db
      .update(medication)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(medication.id, medicationId))
      .returning();

    void this.db.query.patient
      .findFirst({ where: eq(patient.userId, existing.userId) })
      .then((p) => p && notifyPatientDataChanged(p.id, 'medication'));

    return updated;
  }

  /** Doctor changes medication status (pause / resume / discontinue). */
  async changeMedicationStatus(
    doctorUserId: number,
    medicationId: string,
    status: 'active' | 'paused' | 'discontinued',
  ) {
    await this.verifyDoctorExists(doctorUserId);

    const existing = await this.db.query.medication.findFirst({
      where: eq(medication.id, medicationId),
    });

    if (!existing) {
      throw new NotFoundException('Medication not found');
    }

    const updates: Record<string, unknown> = { status, updatedAt: new Date() };

    if (status === 'paused') {
      updates.pausedAt = new Date();
    } else if (status === 'discontinued') {
      updates.discontinuedAt = new Date();
    } else if (status === 'active') {
      updates.pausedAt = null;
      updates.discontinuedAt = null;
      updates.compliance = 'good';
    }

    const [updated] = await this.db
      .update(medication)
      .set(updates)
      .where(eq(medication.id, medicationId))
      .returning();

    void this.db.query.patient
      .findFirst({ where: eq(patient.userId, existing.userId) })
      .then((p) => p && notifyPatientDataChanged(p.id, 'medication'));

    return updated;
  }

  /** Doctor deletes a medication. */
  async deleteMedication(doctorUserId: number, medicationId: string) {
    await this.verifyDoctorExists(doctorUserId);

    const existing = await this.db.query.medication.findFirst({
      where: eq(medication.id, medicationId),
    });

    if (!existing) {
      throw new NotFoundException('Medication not found');
    }

    await this.db.delete(medication).where(eq(medication.id, medicationId));

    return { success: true };
  }

  /** Get medication stats for a doctor's dashboard. */
  async getDoctorMedicationStats(doctorUserId: number) {
    await this.verifyDoctorExists(doctorUserId);

    const stats = await this.db
      .select({
        totalMedications: sql<number>`count(*)`,
        activePrescriptions: sql<number>`count(*) filter (where ${medication.status} = 'active')`,
        poorComplianceCount: sql<number>`count(*) filter (where ${medication.compliance} = 'poor' and ${medication.status} = 'active')`,
      })
      .from(medication);

    return (
      stats[0] ?? {
        totalMedications: 0,
        activePrescriptions: 0,
        poorComplianceCount: 0,
      }
    );
  }

  // ===================== HELPERS =====================

  private async verifyDoctorExists(userId: number) {
    const doctorRow = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });

    if (!doctorRow) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctorRow;
  }

  private async recalculateAdherence(medicationId: string) {
    // Calculate adherence over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await this.db.query.doseLog.findMany({
      where: and(
        eq(doseLog.medicationId, medicationId),
        sql`${doseLog.takenAt} >= ${sevenDaysAgo.toISOString()}`,
      ),
    });

    const totalLogs = logs.length;
    if (totalLogs === 0) return;

    const takenCount = logs.filter((l) => !l.skipped).length;
    const adherencePercent = Math.round((takenCount / totalLogs) * 100);

    // Update compliance based on threshold
    const compliance = adherencePercent >= 70 ? 'good' : 'poor';

    await this.db
      .update(medication)
      .set({
        adherencePercent,
        compliance,
        updatedAt: new Date(),
      })
      .where(eq(medication.id, medicationId));
  }
}
