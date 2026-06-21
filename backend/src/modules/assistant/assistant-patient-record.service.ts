import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, ne, sql } from 'drizzle-orm';

import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  appointment,
  consultation,
  diagnosis,
  doctor,
  familyHistory,
  labResult,
  medication,
  patient,
  patientDocument,
  patientHistory,
  user,
  vitalReading,
} from '../../database/schema';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';
import { AvatarUrlResolver } from '../../shared/storage/avatar-url.resolver';

function toIsoString(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

@Injectable()
export class AssistantPatientRecordService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly avatarUrlResolver: AvatarUrlResolver,
  ) {}

  async getPatientFullRecord(patientIdentifier: string) {
    const resolved = await findPatientByIdentifier(this.db, patientIdentifier);
    const patientId = resolved.id;

    const [patientRow] = await this.db
      .select({
        internalId: patient.id,
        id: patient.patientNumber,
        userId: patient.userId,
        fullName: user.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        phone: user.phone,
        email: user.email,
        address: patient.address,
        riskLevel: patient.riskLevel,
        bmi: patient.bmi,
        heightCm: patient.heightCm,
        weightKg: patient.weightKg,
        smokingStatus: patient.smokingStatus,
        alcoholConsumption: patient.alcoholConsumption,
        exerciseFrequency: patient.exerciseFrequency,
        stressLevel: patient.stressLevel,
        dietaryHabits: patient.dietaryHabits,
        occupation: patient.occupation,
        maritalStatus: patient.maritalStatus,
        nationalId: patient.nationalId,
        avatarUrl: patient.avatarUrl,
        patientSince: patient.createdAt,
        chiefComplaint: patientHistory.chiefComplaint,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .leftJoin(patientHistory, eq(patientHistory.userId, user.id))
      .where(eq(patient.id, patientId))
      .limit(1);

    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }

    const patientUserId = patientRow.userId;

    const [
      allergies,
      family,
      latestVital,
      vitals,
      medications,
      diagnoses,
      labResults,
      documents,
      visits,
      upcomingAppointment,
      visitStats,
    ] = await Promise.all([
      this.db
        .select({
          id: allergy.id,
          category: allergy.category,
          allergen: allergy.allergen,
          reaction: allergy.reaction,
        })
        .from(allergy)
        .where(eq(allergy.userId, patientUserId)),
      this.db
        .select({
          id: familyHistory.id,
          relationship: familyHistory.relationship,
          condition: familyHistory.condition,
          details: familyHistory.details,
        })
        .from(familyHistory)
        .where(eq(familyHistory.userId, patientUserId)),
      this.db.query.vitalReading.findFirst({
        where: eq(vitalReading.patientId, patientId),
        orderBy: desc(vitalReading.createdAt),
      }),
      this.db.query.vitalReading.findMany({
        where: eq(vitalReading.patientId, patientId),
        orderBy: desc(vitalReading.createdAt),
        limit: 50,
      }),
      this.db
        .select()
        .from(medication)
        .where(eq(medication.userId, patientUserId))
        .orderBy(desc(medication.createdAt)),
      this.db.query.diagnosis.findMany({
        where: eq(diagnosis.patientId, patientId),
        orderBy: desc(diagnosis.diagnosedAt),
      }),
      this.db.query.labResult.findMany({
        where: eq(labResult.patientId, patientId),
        orderBy: desc(labResult.resultAt),
      }),
      this.db.query.patientDocument.findMany({
        where: eq(patientDocument.patientId, patientId),
        orderBy: desc(patientDocument.createdAt),
      }),
      this.db
        .select({
          id: consultation.id,
          visitType: consultation.visitType,
          chiefComplaint: consultation.chiefComplaint,
          notes: consultation.notes,
          status: consultation.status,
          startedAt: consultation.startedAt,
          completedAt: consultation.completedAt,
          durationMinutes: consultation.durationMinutes,
          doctorName: user.name,
          doctorSpecialty: doctor.specialty,
        })
        .from(consultation)
        .innerJoin(doctor, eq(consultation.doctorId, doctor.id))
        .innerJoin(user, eq(doctor.userId, user.id))
        .where(eq(consultation.patientId, patientId))
        .orderBy(desc(consultation.startedAt)),
      this.db.query.appointment.findFirst({
        where: and(
          eq(appointment.patientId, patientId),
          gte(appointment.scheduledAt, new Date()),
          ne(appointment.status, 'cancelled'),
        ),
        orderBy: asc(appointment.scheduledAt),
      }),
      this.db
        .select({
          lastAppointmentAt: sql<Date | null>`max(${appointment.scheduledAt}) filter (where ${appointment.scheduledAt} <= now() and ${appointment.status} != 'cancelled')`,
        })
        .from(appointment)
        .where(eq(appointment.patientId, patientId)),
    ]);

    const completedVisits = visits.filter((v) => v.status === 'completed');
    const lastVisitDate =
      toIsoString(completedVisits[0]?.completedAt) ??
      toIsoString(completedVisits[0]?.startedAt) ??
      toIsoString(visitStats[0]?.lastAppointmentAt);

    const primaryCondition =
      diagnoses.find((d) => d.type === 'primary')?.description ?? null;

    return {
      patient: {
        ...patientRow,
        avatarUrl: await this.avatarUrlResolver.resolve(patientRow.avatarUrl),
        dateOfBirth: toIsoString(patientRow.dateOfBirth) ?? null,
        patientSince: toIsoString(patientRow.patientSince) ?? null,
        allergies,
        familyHistory: family,
        activeMedications: medications.filter((m) => m.status === 'active').length,
        condition: primaryCondition,
        lastVisitDate,
        upcomingAppointmentDate: toIsoString(upcomingAppointment?.scheduledAt),
      },
      latestVitals: latestVital ?? null,
      vitalReadings: vitals,
      medications,
      diagnoses,
      labResults,
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName ?? 'Unnamed',
        title: d.title,
        category: d.category ?? 'other',
        uploadedAt: toIsoString(d.createdAt),
        fileSize: d.sizeBytes ? `${(d.sizeBytes / 1024).toFixed(1)} KB` : null,
      })),
      visits: visits.map((v) => ({
        id: v.id,
        date: toIsoString(v.completedAt ?? v.startedAt),
        type: v.visitType,
        doctorName: v.doctorName,
        department: v.doctorSpecialty ?? 'General',
        chiefComplaint: v.chiefComplaint ?? '',
        notes: v.notes ?? '',
        status: v.status,
        durationMin: v.durationMinutes ?? 0,
      })),
    };
  }
}
