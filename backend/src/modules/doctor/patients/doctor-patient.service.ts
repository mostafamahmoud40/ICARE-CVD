import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  doctorPatient,
  patient,
  user,
  doctor,
  allergy,
  familyHistory,
  medication,
  diagnosis,
  vitalReading,
  patientDocument,
  consultation,
  labResult,
} from '../../../database/schema';

@Injectable()
export class DoctorPatientService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async listDoctorPatients(doctorUserId: number) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    const rows = await this.db
      .select({
        id: patient.id,
        fullName: user.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        phone: user.phone,
        email: user.email,
        address: patient.address,
        riskLevel: patient.riskLevel,
        bmi: patient.bmi,
        smokingStatus: patient.smokingStatus,
        occupation: patient.occupation,
        maritalStatus: patient.maritalStatus,
        nationalId: patient.nationalId,
        avatarUrl: patient.avatarUrl,
        patientSince: patient.createdAt,
        activeMedications: sql<number>`(
          select count(*) from ${medication}
          where ${medication.userId} = ${patient.userId}
          and ${medication.status} = 'active'
        )`,
        poorComplianceCount: sql<number>`(
          select count(*) from ${medication}
          where ${medication.userId} = ${patient.userId}
          and ${medication.compliance} = 'poor'
          and ${medication.status} = 'active'
        )`,
        totalVisits: sql<number>`(
          select count(*) from ${consultation}
          where ${consultation.patientId} = ${patient.id}
        )`,
      })
      .from(doctorPatient)
      .innerJoin(patient, eq(doctorPatient.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .where(
        and(
          eq(doctorPatient.doctorId, doctorRow.id),
          eq(doctorPatient.status, 'active'),
        ),
      )
      .orderBy(user.name);

    return rows.map((r) => ({
      ...r,
      activeMedications: Number(r.activeMedications),
      poorComplianceCount: Number(r.poorComplianceCount),
      totalVisits: Number(r.totalVisits),
    }));
  }

  async getDoctorPatientStats(doctorUserId: number) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    const [stats] = await this.db
      .select({
        totalPatients: sql<number>`count(*)`,
        highRiskCount: sql<number>`count(*) filter (where ${patient.riskLevel} = 'high')`,
        complianceAlertsCount: sql<number>`count(*) filter (where exists (
          select 1 from ${medication}
          where ${medication.userId} = ${patient.userId}
          and ${medication.compliance} = 'poor'
          and ${medication.status} = 'active'
        ))`,
      })
      .from(doctorPatient)
      .innerJoin(patient, eq(doctorPatient.patientId, patient.id))
      .where(
        and(
          eq(doctorPatient.doctorId, doctorRow.id),
          eq(doctorPatient.status, 'active'),
        ),
      );

    return {
      totalPatients: Number(stats?.totalPatients ?? 0),
      highRiskCount: Number(stats?.highRiskCount ?? 0),
      complianceAlertsCount: Number(stats?.complianceAlertsCount ?? 0),
    };
  }

  async getPatientFullRecord(doctorUserId: number, patientId: string) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    await this.verifyAssignment(doctorRow.id, patientId);

    const patientRow = await this.db
      .select({
        id: patient.id,
        fullName: user.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        phone: user.phone,
        email: user.email,
        address: patient.address,
        riskLevel: patient.riskLevel,
        bmi: patient.bmi,
        smokingStatus: patient.smokingStatus,
        occupation: patient.occupation,
        maritalStatus: patient.maritalStatus,
        nationalId: patient.nationalId,
        avatarUrl: patient.avatarUrl,
        patientSince: patient.createdAt,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(eq(patient.id, patientId))
      .limit(1);

    if (patientRow.length === 0) {
      throw new NotFoundException('Patient not found');
    }

    const p = patientRow[0];

    const allergies = await this.db
      .select({ allergen: allergy.allergen })
      .from(allergy)
      .where(eq(allergy.userId, p.id as never));

    const family = await this.db
      .select({ condition: familyHistory.condition })
      .from(familyHistory)
      .where(eq(familyHistory.userId, p.id as never));

    const patientUserId = (
      await this.db
        .select({ userId: patient.userId })
        .from(patient)
        .where(eq(patient.id, patientId))
        .limit(1)
    )[0]?.userId;

    const latestVital = await this.db.query.vitalReading.findFirst({
      where: eq(vitalReading.patientId, patientId),
      orderBy: desc(vitalReading.createdAt),
    });

    const vitals = await this.db.query.vitalReading.findMany({
      where: eq(vitalReading.patientId, patientId),
      orderBy: desc(vitalReading.createdAt),
      limit: 50,
    });

    const medications = await this.db
      .select()
      .from(medication)
      .where(eq(medication.userId, patientUserId))
      .orderBy(desc(medication.createdAt));

    const diagnoses = await this.db.query.diagnosis.findMany({
      where: eq(diagnosis.patientId, patientId),
      orderBy: desc(diagnosis.diagnosedAt),
    });

    const labResults = await this.db.query.labResult.findMany({
      where: eq(labResult.patientId, patientId),
      orderBy: desc(labResult.resultAt),
    });

    const documents = await this.db.query.patientDocument.findMany({
      where: eq(patientDocument.patientId, patientId),
      orderBy: desc(patientDocument.createdAt),
    });

    const visits = await this.db.query.consultation.findMany({
      where: eq(consultation.patientId, patientId),
      orderBy: desc(consultation.startedAt),
    });

    return {
      patient: {
        ...p,
        allergies: allergies.map((a) => a.allergen),
        familyHistory: family.map((f) => f.condition),
        activeMedications: medications.filter((m) => m.status === 'active')
          .length,
        poorComplianceCount: medications.filter(
          (m) => m.compliance === 'poor' && m.status === 'active',
        ).length,
        totalVisits: visits.length,
        upcomingAppointmentDate: null,
        lastVisitDate: visits[0]?.completedAt?.toISOString() ?? null,
        condition:
          diagnoses.find((d) => d.type === 'primary')?.description ?? null,
      },
      latestVitals: latestVital ?? null,
      vitalReadings: vitals,
      medications: medications.map((m) => ({
        ...m,
        prescribedAt: m.createdAt.toISOString(),
        prescribedBy: 'Doctor',
        lastTakenAt: m.lastTakenAt?.toISOString() ?? null,
      })),
      diagnoses: diagnoses.map((d) => ({
        ...d,
        diagnosedBy: 'Doctor',
        notes: d.clinicalNotes ?? '',
      })),
      labResults,
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName ?? 'Unnamed',
        type: d.category ?? 'other',
        uploadedAt: d.createdAt.toISOString(),
        uploadedBy: 'System',
        fileSize: d.sizeBytes ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : '—',
      })),
      visits: visits.map((v) => ({
        id: v.id,
        date: v.startedAt.toISOString(),
        type: v.visitType,
        doctorName: 'Doctor',
        chiefComplaint: v.chiefComplaint ?? '',
        diagnosisSummary: '',
        notes: v.notes ?? '',
        durationMin: v.durationMinutes ?? 0,
      })),
    };
  }

  async assignPatient(doctorUserId: number, patientId: string, notes?: string) {
    const doctorRow = await this.verifyDoctor(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const existing = await this.db.query.doctorPatient.findFirst({
      where: and(
        eq(doctorPatient.doctorId, doctorRow.id),
        eq(doctorPatient.patientId, patientId),
      ),
    });

    if (existing) {
      if (existing.status === 'archived') {
        await this.db
          .update(doctorPatient)
          .set({ status: 'active', archivedAt: null, notes })
          .where(eq(doctorPatient.id, existing.id))
          .returning();
        return { reactivated: true };
      }
      return { alreadyAssigned: true };
    }

    const [assignment] = await this.db
      .insert(doctorPatient)
      .values({
        doctorId: doctorRow.id,
        patientId,
        assignedByUserId: doctorUserId,
        notes,
      })
      .returning();

    return assignment;
  }

  private async verifyDoctor(userId: number) {
    const row = await this.db.query.doctor.findFirst({
      where: eq(doctor.userId, userId),
    });
    if (!row) throw new NotFoundException('Doctor profile not found');
    return row;
  }

  private async verifyAssignment(doctorId: string, patientId: string) {
    const row = await this.db.query.doctorPatient.findFirst({
      where: and(
        eq(doctorPatient.doctorId, doctorId),
        eq(doctorPatient.patientId, patientId),
        eq(doctorPatient.status, 'active'),
      ),
    });
    if (!row)
      throw new NotFoundException(
        'Patient not found or not assigned to this doctor',
      );
    return row;
  }
}
