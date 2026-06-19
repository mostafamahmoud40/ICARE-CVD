import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, ne, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  appointment,
  doctorPatient,
  patient,
  user,
  allergy,
  familyHistory,
  medication,
  diagnosis,
  vitalReading,
  patientDocument,
  consultation,
  labResult,
  patientClinicalNote,
  patientCareGoal,
} from '../../../database/schema';
import { DoctorVerifierService } from '../../../shared/doctor/doctor-verifier.service';
import type { UpdateDoctorPatientProfileDto } from './dto/update-doctor-patient-profile.dto';
import type {
  CreatePatientCareGoalDto,
  CreatePatientClinicalNoteDto,
  UpdatePatientCareGoalDto,
} from './dto/patient-profile-extras.dto';

@Injectable()
export class DoctorPatientService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async listDoctorPatients(doctorUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const patientIds = await this.getAccessiblePatientIds(doctorRow.id);
    if (patientIds.length === 0) return [];

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
          and ${consultation.doctorId} = ${doctorRow.id}
        )`,
        lastVisitDate: sql<string | null>`(
          coalesce(
            (
              select ${consultation.completedAt}
              from ${consultation}
              where ${consultation.patientId} = ${patient.id}
              and ${consultation.doctorId} = ${doctorRow.id}
              and ${consultation.completedAt} is not null
              order by ${consultation.completedAt} desc
              limit 1
            ),
            (
              select ${appointment.scheduledAt}
              from ${appointment}
              where ${appointment.patientId} = ${patient.id}
              and ${appointment.doctorId} = ${doctorRow.id}
              order by ${appointment.scheduledAt} desc
              limit 1
            )
          )
        )`,
        condition: sql<string | null>`(
          select ${diagnosis.description}
          from ${diagnosis}
          where ${diagnosis.patientId} = ${patient.id}
          and ${diagnosis.type} = 'primary'
          order by ${diagnosis.diagnosedAt} desc
          limit 1
        )`,
        allergyCount: sql<number>`(
          select count(*) from ${allergy}
          where ${allergy.userId} = ${patient.userId}
        )`,
      })
      .from(patient)
      .innerJoin(user, eq(patient.userId, user.id))
      .where(inArray(patient.id, patientIds))
      .orderBy(user.name);

    return rows.map((r) => ({
      ...r,
      activeMedications: Number(r.activeMedications),
      poorComplianceCount: Number(r.poorComplianceCount),
      totalVisits: Number(r.totalVisits),
      allergyCount: Number(r.allergyCount),
      lastVisitDate: r.lastVisitDate
        ? new Date(r.lastVisitDate).toISOString()
        : null,
    }));
  }

  async getDoctorPatientStats(doctorUserId: number) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    const patientIds = await this.getAccessiblePatientIds(doctorRow.id);

    if (patientIds.length === 0) {
      return {
        totalPatients: 0,
        highRiskCount: 0,
        complianceAlertsCount: 0,
      };
    }

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
      .from(patient)
      .where(inArray(patient.id, patientIds));

    return {
      totalPatients: Number(stats?.totalPatients ?? 0),
      highRiskCount: Number(stats?.highRiskCount ?? 0),
      complianceAlertsCount: Number(stats?.complianceAlertsCount ?? 0),
    };
  }

  async getPatientFullRecord(doctorUserId: number, patientId: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

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

    const patientUserId = (
      await this.db
        .select({ userId: patient.userId })
        .from(patient)
        .where(eq(patient.id, patientId))
        .limit(1)
    )[0]?.userId;

    if (patientUserId == null) {
      throw new NotFoundException('Patient not found');
    }

    const allergies = await this.db
      .select({
        id: allergy.id,
        category: allergy.category,
        allergen: allergy.allergen,
        reaction: allergy.reaction,
      })
      .from(allergy)
      .where(eq(allergy.userId, patientUserId));

    const family = await this.db
      .select({
        id: familyHistory.id,
        relationship: familyHistory.relationship,
        condition: familyHistory.condition,
        details: familyHistory.details,
      })
      .from(familyHistory)
      .where(eq(familyHistory.userId, patientUserId));

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
      where: and(
        eq(consultation.patientId, patientId),
        eq(consultation.doctorId, doctorRow.id),
      ),
      orderBy: desc(consultation.startedAt),
    });

    const profileClinicalNotes = await this.db
      .select({
        id: patientClinicalNote.id,
        body: patientClinicalNote.body,
        createdAt: patientClinicalNote.createdAt,
        authorName: user.name,
      })
      .from(patientClinicalNote)
      .leftJoin(user, eq(patientClinicalNote.authorUserId, user.id))
      .where(eq(patientClinicalNote.patientId, patientId))
      .orderBy(desc(patientClinicalNote.createdAt));

    const careGoals = await this.db
      .select()
      .from(patientCareGoal)
      .where(eq(patientCareGoal.patientId, patientId))
      .orderBy(desc(patientCareGoal.createdAt));

    const upcomingAppointment = await this.db.query.appointment.findFirst({
      where: and(
        eq(appointment.patientId, patientId),
        eq(appointment.doctorId, doctorRow.id),
        gte(appointment.scheduledAt, new Date()),
        ne(appointment.status, 'cancelled'),
      ),
      orderBy: asc(appointment.scheduledAt),
    });

    const [visitStats] = await this.db
      .select({
        totalAppointments: sql<number>`count(*) filter (where ${appointment.status} != 'cancelled')`,
        lastAppointmentAt: sql<Date | null>`max(${appointment.scheduledAt}) filter (where ${appointment.scheduledAt} <= now() and ${appointment.status} != 'cancelled')`,
      })
      .from(appointment)
      .where(
        and(
          eq(appointment.patientId, patientId),
          eq(appointment.doctorId, doctorRow.id),
        ),
      );

    const completedConsultations = visits.filter(
      (visit) => visit.status === 'completed',
    );
    const totalVisits = Math.max(
      completedConsultations.length,
      Number(visitStats?.totalAppointments ?? 0),
    );
    const lastVisitDate =
      completedConsultations[0]?.completedAt?.toISOString() ??
      visitStats?.lastAppointmentAt?.toISOString() ??
      null;

    return {
      patient: {
        ...p,
        allergies: allergies.map((a) => ({
          id: a.id,
          category: a.category,
          allergen: a.allergen,
          reaction: a.reaction ?? '',
        })),
        familyHistory: family.map((f) => ({
          id: f.id,
          relationship: f.relationship,
          condition: f.condition,
          details: f.details ?? '',
        })),
        activeMedications: medications.filter((m) => m.status === 'active')
          .length,
        poorComplianceCount: medications.filter(
          (m) => m.compliance === 'poor' && m.status === 'active',
        ).length,
        totalVisits,
        upcomingAppointmentDate:
          upcomingAppointment?.scheduledAt.toISOString() ?? null,
        lastVisitDate,
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
        diagnosedAt: d.diagnosedAt.toISOString(),
        diagnosedBy: 'Doctor',
        notes: d.clinicalNotes ?? '',
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
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
      profileClinicalNotes: profileClinicalNotes.map((note) => ({
        id: note.id,
        text: note.body,
        date: note.createdAt.toISOString(),
        author: note.authorName ?? 'Doctor',
      })),
      careGoals: careGoals.map((goal) => ({
        id: goal.id,
        metric: goal.metric,
        target: goal.target,
        current: goal.currentValue ?? undefined,
        status: goal.status,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      })),
    };
  }

  async updatePatientProfile(
    doctorUserId: number,
    patientId: string,
    dto: UpdateDoctorPatientProfileDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) {
      throw new NotFoundException('Patient not found');
    }

    const userRow = await this.db.query.user.findFirst({
      where: eq(user.id, patientRow.userId),
    });
    if (!userRow) {
      throw new NotFoundException('Patient not found');
    }

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (userRow.email !== normalizedEmail) {
        const emailTaken = await this.db.query.user.findFirst({
          where: eq(user.email, normalizedEmail),
        });
        if (emailTaken) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    const userUpdate: Partial<typeof user.$inferInsert> = {};
    if (dto.fullName !== undefined) userUpdate.name = dto.fullName.trim();
    if (dto.email !== undefined) userUpdate.email = dto.email.toLowerCase().trim();
    if (dto.phone !== undefined) userUpdate.phone = dto.phone.trim() || null;

    if (Object.keys(userUpdate).length > 0) {
      await this.db
        .update(user)
        .set(userUpdate)
        .where(eq(user.id, patientRow.userId));
    }

    const patientUpdate: Partial<typeof patient.$inferInsert> = {};
    if (dto.address !== undefined) {
      patientUpdate.address = dto.address.trim() || null;
    }
    if (dto.avatarUrl !== undefined) {
      patientUpdate.avatarUrl = dto.avatarUrl.trim() || null;
    }
    if (dto.gender !== undefined) patientUpdate.gender = dto.gender;
    if (dto.bloodType !== undefined) {
      patientUpdate.bloodType = dto.bloodType || null;
    }
    if (dto.maritalStatus !== undefined) {
      patientUpdate.maritalStatus = dto.maritalStatus || null;
    }
    if (dto.occupation !== undefined) {
      patientUpdate.occupation = dto.occupation.trim() || null;
    }
    if (dto.nationalId !== undefined) {
      patientUpdate.nationalId = dto.nationalId.trim() || null;
    }
    if (dto.smokingStatus !== undefined) {
      patientUpdate.smokingStatus = dto.smokingStatus || null;
    }

    if (Object.keys(patientUpdate).length > 0) {
      await this.db
        .update(patient)
        .set(patientUpdate)
        .where(eq(patient.id, patientId));
    }

    return this.getPatientFullRecord(doctorUserId, patientId);
  }

  async assignPatient(doctorUserId: number, patientId: string, notes?: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

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

  async createClinicalNote(
    doctorUserId: number,
    patientId: string,
    dto: CreatePatientClinicalNoteDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const body = dto.body.trim();
    const [note] = await this.db
      .insert(patientClinicalNote)
      .values({
        patientId,
        authorUserId: doctorUserId,
        body,
      })
      .returning();

    const author = await this.db.query.user.findFirst({
      where: eq(user.id, doctorUserId),
      columns: { name: true },
    });

    return {
      id: note.id,
      text: note.body,
      date: note.createdAt.toISOString(),
      author: author?.name ?? 'Doctor',
    };
  }

  async deleteClinicalNote(
    doctorUserId: number,
    patientId: string,
    noteId: string,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const existing = await this.db.query.patientClinicalNote.findFirst({
      where: and(
        eq(patientClinicalNote.id, noteId),
        eq(patientClinicalNote.patientId, patientId),
      ),
    });
    if (!existing) throw new NotFoundException('Clinical note not found');

    await this.db
      .delete(patientClinicalNote)
      .where(eq(patientClinicalNote.id, noteId));

    return { success: true };
  }

  async createCareGoal(
    doctorUserId: number,
    patientId: string,
    dto: CreatePatientCareGoalDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const [goal] = await this.db
      .insert(patientCareGoal)
      .values({
        patientId,
        createdByUserId: doctorUserId,
        metric: dto.metric.trim(),
        target: dto.target.trim(),
        currentValue: dto.current?.trim() || null,
        status: dto.status ?? 'on-track',
      })
      .returning();

    return {
      id: goal.id,
      metric: goal.metric,
      target: goal.target,
      current: goal.currentValue ?? undefined,
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  async updateCareGoal(
    doctorUserId: number,
    patientId: string,
    goalId: string,
    dto: UpdatePatientCareGoalDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const existing = await this.db.query.patientCareGoal.findFirst({
      where: and(
        eq(patientCareGoal.id, goalId),
        eq(patientCareGoal.patientId, patientId),
      ),
    });
    if (!existing) throw new NotFoundException('Care goal not found');

    const [updated] = await this.db
      .update(patientCareGoal)
      .set({
        metric: dto.metric?.trim() ?? existing.metric,
        target: dto.target?.trim() ?? existing.target,
        currentValue:
          dto.current === undefined
            ? existing.currentValue
            : dto.current?.trim() || null,
        status: dto.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(patientCareGoal.id, goalId))
      .returning();

    return {
      id: updated.id,
      metric: updated.metric,
      target: updated.target,
      current: updated.currentValue ?? undefined,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteCareGoal(
    doctorUserId: number,
    patientId: string,
    goalId: string,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);
    await this.verifyDoctorPatientAccess(doctorRow.id, patientId);

    const existing = await this.db.query.patientCareGoal.findFirst({
      where: and(
        eq(patientCareGoal.id, goalId),
        eq(patientCareGoal.patientId, patientId),
      ),
    });
    if (!existing) throw new NotFoundException('Care goal not found');

    await this.db.delete(patientCareGoal).where(eq(patientCareGoal.id, goalId));

    return { success: true };
  }

  private async getAccessiblePatientIds(doctorId: string): Promise<string[]> {
    const [assigned, fromAppointments, fromConsultations] = await Promise.all([
      this.db
        .select({ patientId: doctorPatient.patientId })
        .from(doctorPatient)
        .where(
          and(
            eq(doctorPatient.doctorId, doctorId),
            eq(doctorPatient.status, 'active'),
          ),
        ),
      this.db
        .selectDistinct({ patientId: appointment.patientId })
        .from(appointment)
        .where(eq(appointment.doctorId, doctorId)),
      this.db
        .selectDistinct({ patientId: consultation.patientId })
        .from(consultation)
        .where(eq(consultation.doctorId, doctorId)),
    ]);

    return [
      ...new Set([
        ...assigned.map((row) => row.patientId),
        ...fromAppointments.map((row) => row.patientId),
        ...fromConsultations.map((row) => row.patientId),
      ]),
    ];
  }

  private async verifyDoctorPatientAccess(doctorId: string, patientId: string) {
    const accessibleIds = await this.getAccessiblePatientIds(doctorId);
    if (!accessibleIds.includes(patientId)) {
      throw new NotFoundException(
        'Patient not found or not assigned to this doctor',
      );
    }
  }
}
