import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  consultation,
  consultationDiagnosis,
  consultationPrescription,
  consultationReferral,
  patient,
  doctor,
  user,
} from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import type {
  CreateConsultationDto,
  UpdateConsultationDto,
  LinkDiagnosisDto,
  LinkPrescriptionDto,
  CreateReferralDto,
} from './dto/consultation.dto';

@Injectable()
export class ConsultationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
  ) {}

  async listConsultations(doctorUserId: number, patientId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    return this.db.query.consultation.findMany({
      where: eq(consultation.patientId, patientId),
      orderBy: desc(consultation.startedAt),
    });
  }

  async getConsultation(doctorUserId: number, consultationId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    const doctorNameRow = await this.db
      .select({ name: user.name })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.id, cons.doctorId))
      .limit(1);

    const linkedDiagnoses = await this.db
      .select({
        id: consultationDiagnosis.id,
        diagnosisId: consultationDiagnosis.diagnosisId,
        type: consultationDiagnosis.type,
        notes: consultationDiagnosis.notes,
      })
      .from(consultationDiagnosis)
      .where(eq(consultationDiagnosis.consultationId, consultationId));

    const linkedPrescriptions = await this.db
      .select({
        id: consultationPrescription.id,
        medicationId: consultationPrescription.medicationId,
        isNew: consultationPrescription.isNew,
        duration: consultationPrescription.duration,
        notes: consultationPrescription.notes,
      })
      .from(consultationPrescription)
      .where(eq(consultationPrescription.consultationId, consultationId));

    const referrals = await this.db.query.consultationReferral.findMany({
      where: eq(consultationReferral.consultationId, consultationId),
    });

    return {
      ...cons,
      doctorName: doctorNameRow[0]?.name ?? 'Unknown',
      diagnoses: linkedDiagnoses,
      prescriptions: linkedPrescriptions,
      referrals,
    };
  }

  async createConsultation(
    doctorUserId: number,
    patientId: string,
    dto: CreateConsultationDto,
  ) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [created] = await this.db
      .insert(consultation)
      .values({
        patientId,
        doctorId: doctorRow.id,
        appointmentId: dto.appointmentId,
        visitType: dto.visitType,
        chiefComplaint: dto.chiefComplaint,
        historyOfPresentIllness: dto.historyOfPresentIllness,
        physicalExam: dto.physicalExam,
        plan: dto.plan,
        followUpTimeframe: dto.followUpTimeframe,
        followUpInstructions: dto.followUpInstructions,
        notes: dto.notes,
        durationMinutes: dto.durationMinutes,
      })
      .returning();

    return created;
  }

  async updateConsultation(
    doctorUserId: number,
    consultationId: string,
    dto: UpdateConsultationDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const existing = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!existing) throw new NotFoundException('Consultation not found');

    const updates: Record<string, unknown> = {
      ...dto,
      updatedAt: new Date(),
    };

    if (String(dto.status) === 'completed') {
      updates.completedAt = new Date();
    }

    const [updated] = await this.db
      .update(consultation)
      .set(updates)
      .where(eq(consultation.id, consultationId))
      .returning();

    return updated;
  }

  async linkDiagnosis(
    doctorUserId: number,
    consultationId: string,
    dto: LinkDiagnosisDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    const [linked] = await this.db
      .insert(consultationDiagnosis)
      .values({
        consultationId,
        diagnosisId: dto.diagnosisId,
        type: dto.type,
        notes: dto.notes,
      })
      .returning();

    return linked;
  }

  async unlinkDiagnosis(
    doctorUserId: number,
    consultationId: string,
    diagnosisId: string,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    await this.db
      .delete(consultationDiagnosis)
      .where(
        and(
          eq(consultationDiagnosis.consultationId, consultationId),
          eq(consultationDiagnosis.diagnosisId, diagnosisId),
        ),
      );

    return { success: true };
  }

  async linkPrescription(
    doctorUserId: number,
    consultationId: string,
    dto: LinkPrescriptionDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    const [linked] = await this.db
      .insert(consultationPrescription)
      .values({
        consultationId,
        medicationId: dto.medicationId,
        isNew: dto.isNew ?? true,
        duration: dto.duration,
        notes: dto.notes,
      })
      .returning();

    return linked;
  }

  async addReferral(
    doctorUserId: number,
    consultationId: string,
    patientId: string,
    dto: CreateReferralDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    const [referral] = await this.db
      .insert(consultationReferral)
      .values({
        consultationId,
        patientId,
        specialty: dto.specialty,
        reason: dto.reason,
        urgency: dto.urgency ?? 'routine',
        status: dto.status ?? 'pending',
      })
      .returning();

    return referral;
  }
}
