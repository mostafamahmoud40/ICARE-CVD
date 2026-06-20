import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  appointment,
  consultation,
  consultationDiagnosis,
  consultationPrescription,
  consultationReferral,
  diagnosis,
  labOrder,
  labOrderItem,
  medication,
  patient,
  patientHistory,
  patientQueue,
  doctor,
  user,
  vitalReading,
} from '../../database/schema';
import { DoctorVerifierService } from '../../shared/doctor/doctor-verifier.service';
import { findPatientByIdentifier } from '../../shared/patient/patient-identifier';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  CreateConsultationDto,
  UpdateConsultationDto,
  LinkDiagnosisDto,
  LinkPrescriptionDto,
  UpdateLinkPrescriptionDto,
  CreateReferralDto,
} from './dto/consultation.dto';
import {
  formatMedicalHistorySummary,
  formatProcedureDetailsSummary,
  loadConsultationAiStudies,
  loadConsultationTestOrders,
  parseHomeMeasurements,
  parseReportOverrides,
  applyReportOverrides,
} from './consultation-report-session.loader';

@Injectable()
export class ConsultationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly doctorVerifier: DoctorVerifierService,
    private readonly notificationsService: NotificationsService,
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
    return this.buildConsultationReport(consultationId);
  }

  async listPatientConsultations(patientUserId: number) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, patientUserId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const rows = await this.db
      .select({
        id: consultation.id,
        startedAt: consultation.startedAt,
        completedAt: consultation.completedAt,
        visitType: consultation.visitType,
        chiefComplaint: consultation.chiefComplaint,
        notes: consultation.notes,
        plan: consultation.plan,
        status: consultation.status,
        doctorName: user.name,
        doctorSpecialty: doctor.specialty,
        appointmentVisitType: appointment.visitType,
      })
      .from(consultation)
      .innerJoin(doctor, eq(consultation.doctorId, doctor.id))
      .innerJoin(user, eq(doctor.userId, user.id))
      .leftJoin(appointment, eq(consultation.appointmentId, appointment.id))
      .where(
        and(
          eq(consultation.patientId, patientRow.id),
          eq(consultation.status, 'completed'),
          isNotNull(consultation.reportPublishedAt),
        ),
      )
      .orderBy(desc(consultation.completedAt), desc(consultation.startedAt));

    return rows.map((row) => ({
      id: row.id,
      scheduledAt: (row.completedAt ?? row.startedAt).toISOString(),
      visitType: this.mapConsultationVisitMode(row.appointmentVisitType),
      doctorName: row.doctorName,
      doctorSpecialty: row.doctorSpecialty ?? 'Cardiology',
      recordStatus: this.resolveRecordStatus(row),
      visitTitle: this.formatVisitTitle(row.visitType),
    }));
  }

  async getPatientConsultation(patientUserId: number, consultationId: string) {
    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.userId, patientUserId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const cons = await this.db.query.consultation.findFirst({
      where: and(
        eq(consultation.id, consultationId),
        eq(consultation.patientId, patientRow.id),
        eq(consultation.status, 'completed'),
        isNotNull(consultation.reportPublishedAt),
      ),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    return this.buildConsultationReport(consultationId);
  }

  private resolveRecordStatus(row: {
    chiefComplaint: string | null;
    notes: string | null;
    plan: string | null;
  }): 'report-ready' | 'pending-report' {
    const hasContent = Boolean(
      row.chiefComplaint?.trim() ||
        row.notes?.trim() ||
        row.plan?.trim(),
    );
    return hasContent ? 'report-ready' : 'pending-report';
  }

  private formatVisitTitle(visitType: string): string {
    const normalized = visitType.replace(/-/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private mapConsultationVisitMode(
    appointmentVisitType: string | null | undefined,
  ): 'clinic' | 'virtual' {
    const value = (appointmentVisitType ?? '').toLowerCase();
    if (value.includes('virtual') || value.includes('tele')) return 'virtual';
    return 'clinic';
  }

  private formatPhysicalExamForReport(raw: string | null | undefined): string {
    if (!raw?.trim()) return '';
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const lines = Object.entries(parsed)
        .filter(([, value]) => value?.trim())
        .map(([key, value]) => {
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (c) => c.toUpperCase());
          return `${label}: ${value.trim()}`;
        });
      return lines.join('\n');
    } catch {
      return raw.trim();
    }
  }

  private async buildConsultationReport(consultationId: string) {
    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.id, consultationId),
    });
    if (!cons) throw new NotFoundException('Consultation not found');

    const doctorRow = await this.db
      .select({
        name: user.name,
        specialty: doctor.specialty,
      })
      .from(doctor)
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(doctor.id, cons.doctorId))
      .limit(1);

    const linkedDiagnoses = await this.db
      .select({
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        description: diagnosis.description,
        type: consultationDiagnosis.type,
        severity: diagnosis.severity,
        notes: consultationDiagnosis.notes,
      })
      .from(consultationDiagnosis)
      .innerJoin(diagnosis, eq(consultationDiagnosis.diagnosisId, diagnosis.id))
      .where(eq(consultationDiagnosis.consultationId, consultationId));

    const linkedPrescriptions = await this.db
      .select({
        id: consultationPrescription.id,
        medicationId: medication.id,
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        isNew: consultationPrescription.isNew,
        duration: consultationPrescription.duration,
        notes: consultationPrescription.notes,
      })
      .from(consultationPrescription)
      .innerJoin(medication, eq(consultationPrescription.medicationId, medication.id))
      .where(eq(consultationPrescription.consultationId, consultationId));

    const referrals = await this.db.query.consultationReferral.findMany({
      where: eq(consultationReferral.consultationId, consultationId),
    });

    let labOrderRows: Array<{ id: string; notes: string | null }> = [];
    let labItems: Array<{ id: string; labOrderId: string; testName: string }> = [];
    if (cons.appointmentId) {
      labOrderRows = await this.db
        .select({ id: labOrder.id, notes: labOrder.notes })
        .from(labOrder)
        .where(
          and(
            eq(labOrder.appointmentId, cons.appointmentId),
            eq(labOrder.patientId, cons.patientId),
          ),
        );
      const labOrderIds = labOrderRows.map((row) => row.id);
      if (labOrderIds.length > 0) {
        labItems = await this.db
          .select({
            id: labOrderItem.id,
            labOrderId: labOrderItem.labOrderId,
            testName: labOrderItem.testName,
          })
          .from(labOrderItem)
          .where(inArray(labOrderItem.labOrderId, labOrderIds));
      }
    }

    const vitalRow =
      (await this.db.query.vitalReading.findFirst({
        where: eq(vitalReading.consultationId, consultationId),
        orderBy: desc(vitalReading.createdAt),
      })) ??
      (await this.db.query.vitalReading.findFirst({
        where: and(
          eq(vitalReading.patientId, cons.patientId),
          eq(vitalReading.source, 'clinic'),
        ),
        orderBy: desc(vitalReading.createdAt),
      }));

    const appointmentRow = cons.appointmentId
      ? await this.db.query.appointment.findFirst({
          where: eq(appointment.id, cons.appointmentId),
        })
      : null;

    const [testOrders, aiStudiesRaw] = await Promise.all([
      loadConsultationTestOrders(this.db, cons.patientId, cons.appointmentId),
      loadConsultationAiStudies(this.db, consultationId),
    ]);

    const reportOverrides = parseReportOverrides(cons.reportOverrides);
    const medicalHistoryComputed = formatMedicalHistorySummary(
      cons.consultationMedicalHistory,
    );
    const procedureDetailsComputed = formatProcedureDetailsSummary(
      cons.consultationProcedureDetails,
    );
    const sessionContent = applyReportOverrides({
      medicalHistorySummary: medicalHistoryComputed,
      procedureDetailsSummary: procedureDetailsComputed,
      aiStudies: aiStudiesRaw,
      overrides: reportOverrides,
    });

    const visitInstant = cons.completedAt ?? cons.startedAt;
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      visitId: cons.id,
      patientId: cons.patientId,
      status: cons.status,
      date: visitInstant.toISOString(),
      time: timeFormatter.format(visitInstant),
      doctorName: doctorRow[0]?.name ?? 'Doctor',
      doctorSpecialty: doctorRow[0]?.specialty ?? 'Cardiology',
      type: cons.visitType,
      consultationVisitMode: this.mapConsultationVisitMode(
        appointmentRow?.visitType,
      ),
      durationMin: cons.durationMinutes,
      chiefComplaint: cons.chiefComplaint,
      historyOfPresentIllness: cons.historyOfPresentIllness,
      chiefComplaintStructured: cons.chiefComplaintStructured,
      physicalExam: this.formatPhysicalExamForReport(cons.physicalExam),
      physicalExamRaw: cons.physicalExam,
      plan: cons.plan,
      notes: cons.notes,
      clinicalNotes: cons.notes,
      assessmentAndPlan: cons.plan,
      homeMonitoring: cons.homeMonitoring,
      medicalHistorySummary: sessionContent.medicalHistorySummary,
      procedureDetailsSummary: sessionContent.procedureDetailsSummary,
      homeMeasurements: parseHomeMeasurements(cons.homeMonitoring),
      testOrders,
      aiStudies: sessionContent.aiStudies,
      patientDiagnosisSummary: cons.patientDiagnosisSummary,
      patientLifestyleAdvice: cons.patientLifestyleAdvice,
      patientDangerSigns: cons.patientDangerSigns,
      followUp: {
        timeframe: cons.followUpTimeframe,
        instructions: cons.followUpInstructions,
      },
      vitals: vitalRow
        ? {
            systolicBP: vitalRow.systolicBp,
            diastolicBP: vitalRow.diastolicBp,
            heartRate: vitalRow.heartRate,
            oxygenSaturation: vitalRow.oxygenSaturation,
            temperature: vitalRow.temperature
              ? Number(vitalRow.temperature)
              : null,
            weight: vitalRow.weight ? Number(vitalRow.weight) : null,
            bloodSugar: vitalRow.bloodSugar,
            respiratoryRate: null,
            heightCm: null,
          }
        : null,
      diagnoses: linkedDiagnoses.map((row) => ({
        id: row.id,
        icdCode: row.icdCode,
        description: row.description,
        type: row.type,
        severity: row.severity,
        notes: row.notes,
      })),
      prescriptions: linkedPrescriptions.map((row) => ({
        id: row.medicationId,
        name: row.name,
        dose: row.dose,
        frequency: row.frequency,
        duration: row.duration ?? '',
        isNew: row.isNew,
        notes: row.notes,
      })),
      labOrders: labItems.map((item) => ({
        id: item.id,
        orderId: item.labOrderId,
        testName: item.testName,
      })),
      referrals: referrals.map((row) => ({
        specialty: row.specialty,
        reason: row.reason,
        urgency: row.urgency,
      })),
      recordStatus: this.resolveRecordStatus(cons),
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
        homeMonitoring: dto.homeMonitoring,
        consultationMedicalHistory: dto.consultationMedicalHistory,
        consultationProcedureDetails: dto.consultationProcedureDetails,
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

    const isPublishingReport =
      String(dto.status) === 'completed' && existing.status !== 'completed';

    if (String(dto.status) === 'completed') {
      updates.completedAt = new Date();
      if (isPublishingReport) {
        updates.reportPublishedAt = new Date();
      }
    }

    const [updated] = await this.db
      .update(consultation)
      .set(updates)
      .where(eq(consultation.id, consultationId))
      .returning();

    if (isPublishingReport) {
      await this.notifyPatientReportPublished(consultationId);
    }

    return updated;
  }

  async deleteConsultation(doctorUserId: number, patientId: string, consultationId: string) {
    await this.doctorVerifier.verify(doctorUserId);

    const patientRow = await findPatientByIdentifier(this.db, patientId);

    const existing = await this.db.query.consultation.findFirst({
      where: and(
        eq(consultation.id, consultationId),
        eq(consultation.patientId, patientRow.id),
      ),
    });
    if (!existing) throw new NotFoundException('Consultation not found');

    await this.db.delete(consultation).where(eq(consultation.id, consultationId));

    return { success: true };
  }

  private async notifyPatientReportPublished(consultationId: string) {
    const [ctx] = await this.db
      .select({
        patientUserId: patient.userId,
        doctorName: user.name,
      })
      .from(consultation)
      .innerJoin(patient, eq(consultation.patientId, patient.id))
      .innerJoin(doctor, eq(consultation.doctorId, doctor.id))
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(consultation.id, consultationId))
      .limit(1);

    if (!ctx?.patientUserId) return;

    await this.notificationsService.dispatch({
      userId: ctx.patientUserId,
      kind: 'consultation',
      title: 'Visit summary ready',
      body: `Your consultation report with ${ctx.doctorName} is ready to view.`,
      href: `/consultations/${consultationId}`,
      metadata: { consultationId },
    });
  }

  async resolveQueueConsultationSession(doctorUserId: number, queueId: string) {
    const doctorRow = await this.doctorVerifier.verify(doctorUserId);

    const [queueRow] = await this.db
      .select({
        patientId: appointment.patientId,
        patientUserId: patient.userId,
        appointmentId: appointment.id,
        visitType: appointment.visitType,
        reason: appointment.reason,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .where(
        and(
          eq(patientQueue.id, queueId),
          eq(appointment.doctorId, doctorRow.id),
        ),
      )
      .limit(1);

    if (!queueRow) throw new NotFoundException('Queue entry not found');

    let cons = await this.db.query.consultation.findFirst({
      where: and(
        eq(consultation.patientId, queueRow.patientId),
        eq(consultation.appointmentId, queueRow.appointmentId),
        eq(consultation.doctorId, doctorRow.id),
        eq(consultation.status, 'in-progress'),
      ),
      orderBy: desc(consultation.startedAt),
    });

    if (!cons) {
      const [created] = await this.db
        .insert(consultation)
        .values({
          patientId: queueRow.patientId,
          doctorId: doctorRow.id,
          appointmentId: queueRow.appointmentId,
          visitType: this.mapAppointmentVisitType(queueRow.visitType),
          chiefComplaint: queueRow.reason ?? undefined,
          status: 'in-progress',
        })
        .returning();
      cons = created;
    }

    const linkedDiagnoses = await this.db
      .select({
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        description: diagnosis.description,
        type: diagnosis.type,
        severity: diagnosis.severity,
        notes: diagnosis.clinicalNotes,
        linkId: consultationDiagnosis.id,
      })
      .from(consultationDiagnosis)
      .innerJoin(diagnosis, eq(consultationDiagnosis.diagnosisId, diagnosis.id))
      .where(eq(consultationDiagnosis.consultationId, cons.id))
      .orderBy(desc(consultationDiagnosis.createdAt));

    const labOrders = await this.db
      .select()
      .from(labOrder)
      .where(
        and(
          eq(labOrder.patientId, queueRow.patientId),
          eq(labOrder.appointmentId, queueRow.appointmentId),
          eq(labOrder.status, 'ordered'),
        ),
      )
      .orderBy(desc(labOrder.createdAt));

    const labOrderIds = labOrders.map((order) => order.id);
    const labItems =
      labOrderIds.length === 0
        ? []
        : await this.db
            .select()
            .from(labOrderItem)
            .where(inArray(labOrderItem.labOrderId, labOrderIds));

    const itemsByOrder = new Map<string, (typeof labItems)[number][]>();
    for (const item of labItems) {
      const list = itemsByOrder.get(item.labOrderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.labOrderId, list);
    }

    const linkedPrescriptions = await this.db
      .select({
        id: consultationPrescription.id,
        medicationId: medication.id,
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        type: medication.type,
        instructions: medication.instructions,
        duration: consultationPrescription.duration,
        notes: consultationPrescription.notes,
        durationDays: medication.durationDays,
      })
      .from(consultationPrescription)
      .innerJoin(medication, eq(consultationPrescription.medicationId, medication.id))
      .where(eq(consultationPrescription.consultationId, cons.id))
      .orderBy(desc(consultationPrescription.createdAt));

    const historyRow = await this.db.query.patientHistory.findFirst({
      where: eq(patientHistory.userId, queueRow.patientUserId),
    });

    return {
      consultation: cons,
      diagnoses: linkedDiagnoses,
      labOrders: labOrders.map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
      })),
      prescriptions: linkedPrescriptions,
      patientHistory: historyRow
        ? {
            noCardiacHistory: historyRow.noCardiacHistory,
            pastCardiacHistory: historyRow.pastCardiacHistory,
            noNonCardiacHistory: historyRow.noNonCardiacHistory,
            pastNonCardiacHistory: historyRow.pastNonCardiacHistory,
            medicalHistoryNotes: historyRow.medicalHistoryNotes,
          }
        : null,
    };
  }

  private mapAppointmentVisitType(
    visitType: string,
  ): 'follow-up' | 'new' | 'walk-in' | 'post-procedure' | 'urgent' {
    const normalized = visitType.trim().toLowerCase().replace(/_/g, '-');
    const allowed = [
      'follow-up',
      'new',
      'walk-in',
      'post-procedure',
      'urgent',
    ] as const;
    if ((allowed as readonly string[]).includes(normalized)) {
      return normalized as (typeof allowed)[number];
    }
    if (normalized.includes('follow')) return 'follow-up';
    if (normalized.includes('urgent') || normalized.includes('emergency')) {
      return 'urgent';
    }
    return 'walk-in';
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

  async updateLinkedPrescription(
    doctorUserId: number,
    consultationId: string,
    medicationId: string,
    dto: UpdateLinkPrescriptionDto,
  ) {
    await this.doctorVerifier.verify(doctorUserId);

    const link = await this.db.query.consultationPrescription.findFirst({
      where: and(
        eq(consultationPrescription.consultationId, consultationId),
        eq(consultationPrescription.medicationId, medicationId),
      ),
    });
    if (!link) {
      throw new NotFoundException('Consultation prescription not found');
    }

    const [updated] = await this.db
      .update(consultationPrescription)
      .set({
        ...(dto.duration !== undefined ? { duration: dto.duration } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      })
      .where(eq(consultationPrescription.id, link.id))
      .returning();

    return updated;
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
