import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, desc, eq, gte, lte, ne, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider';
import type { Database } from '../../database/drizzle.provider';
import {
  allergy,
  appointment,
  consultation,
  consultationDiagnosis,
  consultationPrescription,
  diagnosis,
  doctor,
  medication,
  patient,
  patientDocument,
  patientQueue,
  user,
  vitalReading,
} from '../../database/schema';
import type { NewPatientQueueRow } from '../../database/schema/patientQueue.schema';
import type {
  QueueFilter,
  QueuePriority,
  QueueStatus,
} from './dto/patient-queue.dto';

export type QueuePatientDocumentCategory =
  | 'lab_report'
  | 'imaging'
  | 'ecg'
  | 'prescription'
  | 'referral'
  | 'other';

@Injectable()
export class AssistantPatientQueueService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /* ------------------------------------------------------------------ */
  /*  Stats                                                              */
  /* ------------------------------------------------------------------ */

  async getStats() {
    const { todayStart, todayEnd } = this.todayBounds();
    await this.ensureTodayQueueEntries(todayStart, todayEnd);

    // All queue entries whose appointment is scheduled today
    const baseFilter = and(
      gte(appointment.scheduledAt, todayStart),
      lte(appointment.scheduledAt, todayEnd),
    );

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(baseFilter);

    const statusCounts = async (status: QueueStatus) => {
      const [row] = await this.db
        .select({ count: count() })
        .from(patientQueue)
        .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
        .where(and(baseFilter, eq(patientQueue.status, status)));
      return row.count;
    };

    const avgWait = await this.computeAvgWaitTime(todayStart, todayEnd);

    return {
      totalToday: totalRow.count,
      scheduled: await statusCounts('scheduled'),
      arrived: await statusCounts('arrived'),
      inWaiting: await statusCounts('waiting'),
      inConsultation: await statusCounts('in-consultation'),
      completed: await statusCounts('completed'),
      noShow: await statusCounts('no-show'),
      avgWaitMin: avgWait,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  List / Get                                                         */
  /* ------------------------------------------------------------------ */

  async listQueueEntries(filter?: QueueFilter) {
    const { todayStart, todayEnd } = this.todayBounds();
    await this.ensureTodayQueueEntries(todayStart, todayEnd);
    const conditions = this.buildFilterConditions(filter, todayStart, todayEnd);

    const rows = await this.db
      .select({
        queueId: patientQueue.id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: patientQueue.status,
        priority: patientQueue.priority,
        visitType: appointment.visitType,
        reason: appointment.reason,
        notes: patientQueue.notes,
        roomNumber: patientQueue.roomNumber,
        estimatedDurationMin: patientQueue.estimatedDurationMin,
        scheduledAt: appointment.scheduledAt,
        arrivedAt: patientQueue.arrivedAt,
        waitingSince: patientQueue.waitingSince,
        startedAt: patientQueue.startedAt,
        completedAt: patientQueue.completedAt,
        patientName: user.name,
        patientPhone: user.phone,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        doctorSpecialty: doctor.specialty,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE ${patientQueue.priority}
          WHEN 'emergency' THEN 0
          WHEN 'urgent' THEN 1
          ELSE 2
        END`,
        appointment.scheduledAt,
      );

    const doctorIds = [...new Set(rows.map((r) => r.doctorId))];
    const doctorNames = await this.batchDoctorNames(doctorIds);

    const patientIds = [...new Set(rows.map((r) => r.patientId))];
    const allergyCounts = await this.batchAllergyCounts(patientIds);
    const medicationCounts = await this.batchActiveMedicationCounts(patientIds);
    const vitalAlertCounts = await this.batchVitalAlertCounts(patientIds);

    return rows.map((row) =>
      this.formatQueueEntry(
        row,
        doctorNames,
        allergyCounts,
        medicationCounts,
        vitalAlertCounts,
      ),
    );
  }

  async getVisitOutcomes(queueId: string) {
    const row = await this.db
      .select({
        patientId: appointment.patientId,
        appointmentId: patientQueue.appointmentId,
        queueStatus: patientQueue.status,
        doctorName: user.name,
        doctorSpecialty: doctor.specialty,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .innerJoin(user, eq(doctor.userId, user.id))
      .where(eq(patientQueue.id, queueId))
      .limit(1);

    if (!row.length) throw new NotFoundException('Queue entry not found');

    const { patientId, appointmentId, queueStatus, doctorName, doctorSpecialty } =
      row[0];

    const cons = await this.db.query.consultation.findFirst({
      where: eq(consultation.appointmentId, appointmentId),
      orderBy: desc(consultation.startedAt),
    });

    const prescriptionDoc = await this.db.query.patientDocument.findFirst({
      where: and(
        eq(patientDocument.patientId, patientId),
        eq(patientDocument.category, 'prescription'),
      ),
      orderBy: desc(patientDocument.createdAt),
    });

    let prescriptionItems: {
      id: string
      name: string
      dose: string
      frequency: string
      duration: string | null
      instructions: string | null
    }[] = [];

    let reportDiagnoses: {
      icdCode: string
      description: string
      type: string
    }[] = [];

    if (cons) {
      const rxRows = await this.db
        .select({
          id: consultationPrescription.id,
          name: medication.name,
          dose: medication.dose,
          frequency: medication.frequency,
          duration: consultationPrescription.duration,
          instructions: medication.instructions,
        })
        .from(consultationPrescription)
        .innerJoin(
          medication,
          eq(consultationPrescription.medicationId, medication.id),
        )
        .where(eq(consultationPrescription.consultationId, cons.id));

      prescriptionItems = rxRows.map((r) => ({
        id: r.id,
        name: r.name,
        dose: r.dose,
        frequency: r.frequency,
        duration: r.duration,
        instructions: r.instructions,
      }));

      const dxRows = await this.db
        .select({
          icdCode: diagnosis.icdCode,
          description: diagnosis.description,
          type: consultationDiagnosis.type,
        })
        .from(consultationDiagnosis)
        .innerJoin(diagnosis, eq(consultationDiagnosis.diagnosisId, diagnosis.id))
        .where(eq(consultationDiagnosis.consultationId, cons.id));

      reportDiagnoses = dxRows.map((d) => ({
        icdCode: d.icdCode,
        description: d.description,
        type: d.type,
      }));
    }

    const hasPrescriptionData =
      prescriptionItems.length > 0 || Boolean(prescriptionDoc);
    const hasReportContent = Boolean(
      cons &&
        (cons.chiefComplaint?.trim() ||
          cons.plan?.trim() ||
          cons.physicalExam?.trim() ||
          cons.notes?.trim() ||
          reportDiagnoses.length > 0),
    );
    const consultationCompleted = cons?.status === 'completed';

    const prescriptionStatus = hasPrescriptionData
      ? 'ready'
      : cons && queueStatus === 'completed'
        ? 'pending'
        : 'pending';

    const reportStatus =
      consultationCompleted && hasReportContent
        ? 'ready'
        : cons
          ? 'pending'
          : 'pending';

    return {
      patientId,
      consultationId: cons?.id ?? null,
      doctorName,
      doctorSpecialty: doctorSpecialty ?? 'General',
      prescription: {
        status: prescriptionStatus,
        medicationCount: prescriptionItems.length,
        documentId: prescriptionDoc?.id ?? null,
        items: prescriptionItems,
      },
      report: {
        status: reportStatus,
        chiefComplaint: cons?.chiefComplaint ?? null,
        historyOfPresentIllness: cons?.historyOfPresentIllness ?? null,
        physicalExam: cons?.physicalExam ?? null,
        plan: cons?.plan ?? null,
        followUpTimeframe: cons?.followUpTimeframe ?? null,
        followUpInstructions: cons?.followUpInstructions ?? null,
        notes: cons?.notes ?? null,
        diagnoses: reportDiagnoses,
        completedAt: cons?.completedAt?.toISOString() ?? null,
      },
    };
  }

  async listQueuePatientDocuments(queueId: string) {
    const row = await this.db
      .select({ patientId: appointment.patientId })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(eq(patientQueue.id, queueId))
      .limit(1);

    if (!row.length) throw new NotFoundException('Queue entry not found');

    const patientId = row[0].patientId;

    return this.db.query.patientDocument.findMany({
      where: eq(patientDocument.patientId, patientId),
      orderBy: desc(patientDocument.createdAt),
    });
  }

  async registerQueuePatientDocument(
    queueId: string,
    assistantUserId: number,
    dto: {
      fileName: string;
      contentType: string;
      category: QueuePatientDocumentCategory;
      title?: string;
      s3Key: string;
      fileSize?: number;
    },
  ) {
    if (!dto.s3Key?.trim()) {
      throw new BadRequestException('s3Key is required');
    }

    const row = await this.db
      .select({ patientId: appointment.patientId })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(eq(patientQueue.id, queueId))
      .limit(1);

    if (!row.length) throw new NotFoundException('Queue entry not found');

    const patientId = row[0].patientId;

    const patientRow = await this.db.query.patient.findFirst({
      where: eq(patient.id, patientId),
    });
    if (!patientRow) throw new NotFoundException('Patient not found');

    const [doc] = await this.db
      .insert(patientDocument)
      .values({
        userId: patientRow.userId,
        patientId,
        fileName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.fileSize ?? null,
        category: dto.category,
        title: dto.title ?? null,
        uploadedByUserId: assistantUserId,
        s3Key: dto.s3Key,
      })
      .returning();

    return doc;
  }

  async getQueueEntry(queueId: string) {
    const rows = await this.db
      .select({
        queueId: patientQueue.id,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        status: patientQueue.status,
        priority: patientQueue.priority,
        visitType: appointment.visitType,
        reason: appointment.reason,
        notes: patientQueue.notes,
        roomNumber: patientQueue.roomNumber,
        estimatedDurationMin: patientQueue.estimatedDurationMin,
        scheduledAt: appointment.scheduledAt,
        arrivedAt: patientQueue.arrivedAt,
        waitingSince: patientQueue.waitingSince,
        startedAt: patientQueue.startedAt,
        completedAt: patientQueue.completedAt,
        patientName: user.name,
        patientPhone: user.phone,
        patientDateOfBirth: patient.dateOfBirth,
        patientGender: patient.gender,
        doctorSpecialty: doctor.specialty,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .where(eq(patientQueue.id, queueId))
      .limit(1);

    if (!rows.length) throw new NotFoundException('Queue entry not found');

    const row = rows[0];
    const doctorNames = await this.batchDoctorNames([row.doctorId]);
    const allergyCounts = await this.batchAllergyCounts([row.patientId]);
    const medicationCounts = await this.batchActiveMedicationCounts([
      row.patientId,
    ]);
    const vitalAlertCounts = await this.batchVitalAlertCounts([row.patientId]);

    return this.formatQueueEntry(
      row,
      doctorNames,
      allergyCounts,
      medicationCounts,
      vitalAlertCounts,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Add appointment to queue                                           */
  /* ------------------------------------------------------------------ */

  async addToQueue(
    dto: {
      appointmentId: string;
      priority?: QueuePriority;
      roomNumber?: string;
      estimatedDurationMin?: number;
      notes?: string;
    },
    addedByUserId?: number,
  ) {
    const appt = await this.db.query.appointment.findFirst({
      where: eq(appointment.id, dto.appointmentId),
    });
    if (!appt) throw new NotFoundException('Appointment not found');

    const existing = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.appointmentId, dto.appointmentId),
    });
    if (existing) throw new NotFoundException('Appointment already in queue');

    const values: NewPatientQueueRow = {
      appointmentId: dto.appointmentId,
      priority: dto.priority ?? 'normal',
      roomNumber: dto.roomNumber ?? null,
      estimatedDurationMin: dto.estimatedDurationMin ?? null,
      notes: dto.notes ?? null,
      addedByUserId: addedByUserId ?? null,
      status: 'scheduled',
    };

    const [created] = await this.db
      .insert(patientQueue)
      .values(values)
      .returning();

    return this.getQueueEntry(created.id);
  }

  /* ------------------------------------------------------------------ */
  /*  Update queue status                                                */
  /* ------------------------------------------------------------------ */

  async updateStatus(queueId: string, status: QueueStatus) {
    const existing = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.id, queueId),
    });
    if (!existing) throw new NotFoundException('Queue entry not found');

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    const now = new Date();
    if (status === 'arrived') updates.arrivedAt = now;
    if (status === 'waiting') updates.waitingSince = now;
    if (status === 'in-consultation') updates.startedAt = now;
    if (status === 'completed') updates.completedAt = now;

    await this.db
      .update(patientQueue)
      .set(updates)
      .where(eq(patientQueue.id, queueId));

    return this.getQueueEntry(queueId);
  }

  /* ------------------------------------------------------------------ */
  /*  Update queue metadata                                              */
  /* ------------------------------------------------------------------ */

  async updateEntry(
    queueId: string,
    dto: {
      priority?: QueuePriority;
      roomNumber?: string;
      notes?: string;
      estimatedDurationMin?: number;
    },
  ) {
    const existing = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.id, queueId),
    });
    if (!existing) throw new NotFoundException('Queue entry not found');

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.priority !== undefined) updates.priority = dto.priority;
    if (dto.roomNumber !== undefined) updates.roomNumber = dto.roomNumber;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.estimatedDurationMin !== undefined)
      updates.estimatedDurationMin = dto.estimatedDurationMin;

    await this.db
      .update(patientQueue)
      .set(updates)
      .where(eq(patientQueue.id, queueId));

    return this.getQueueEntry(queueId);
  }

  /* ------------------------------------------------------------------ */
  /*  Remove from queue                                                  */
  /* ------------------------------------------------------------------ */

  async removeFromQueue(queueId: string) {
    const existing = await this.db.query.patientQueue.findFirst({
      where: eq(patientQueue.id, queueId),
    });
    if (!existing) throw new NotFoundException('Queue entry not found');

    await this.db.delete(patientQueue).where(eq(patientQueue.id, queueId));

    return { success: true };
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                    */
  /* ------------------------------------------------------------------ */

  private todayBounds() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    return { todayStart, todayEnd };
  }

  private buildFilterConditions(
    filter: QueueFilter | undefined,
    todayStart: Date,
    todayEnd: Date,
  ) {
    const conditions = [
      gte(appointment.scheduledAt, todayStart),
      lte(appointment.scheduledAt, todayEnd),
    ];

    if (filter === 'active') {
      conditions.push(
        or(
          eq(patientQueue.status, 'scheduled'),
          eq(patientQueue.status, 'arrived'),
          eq(patientQueue.status, 'waiting'),
          eq(patientQueue.status, 'in-consultation'),
        )!,
      );
    } else if (filter === 'scheduled') {
      conditions.push(eq(patientQueue.status, 'scheduled'));
    } else if (filter === 'completed') {
      conditions.push(eq(patientQueue.status, 'completed'));
    } else if (filter === 'no-show') {
      conditions.push(eq(patientQueue.status, 'no-show'));
    }

    return conditions;
  }

  private computeAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age;
  }

  private async ensureTodayQueueEntries(todayStart: Date, todayEnd: Date) {
    const todayAppointments = await this.db
      .select({ id: appointment.id })
      .from(appointment)
      .where(
        and(
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
          ne(appointment.status, 'cancelled'),
        ),
      );

    if (todayAppointments.length === 0) return;

    const existingQueueRows = await this.db
      .select({ appointmentId: patientQueue.appointmentId })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
        ),
      );

    const queuedAppointmentIds = new Set(
      existingQueueRows.map((row) => row.appointmentId),
    );
    const values: NewPatientQueueRow[] = todayAppointments
      .filter((row) => !queuedAppointmentIds.has(row.id))
      .map((row) => ({
        appointmentId: row.id,
        status: 'scheduled',
        priority: 'normal',
      }));

    if (values.length === 0) return;

    await this.db.insert(patientQueue).values(values).onConflictDoNothing();
  }

  private formatQueueEntry(
    row: {
      queueId: string;
      appointmentId: string;
      patientId: string;
      doctorId: string;
      status: string;
      priority: string;
      visitType: string;
      reason: string | null;
      notes: string | null;
      roomNumber: string | null;
      estimatedDurationMin: number | null;
      scheduledAt: Date;
      arrivedAt: Date | null;
      waitingSince: Date | null;
      startedAt: Date | null;
      completedAt: Date | null;
      patientName: string;
      patientPhone: string | null;
      patientDateOfBirth: Date;
      patientGender: string;
      doctorSpecialty: string | null;
    },
    doctorNames: Map<string, string>,
    allergyCounts: Map<string, number>,
    medicationCounts: Map<string, number>,
    vitalAlertCounts: Map<string, number>,
  ) {
    return {
      id: row.queueId,
      appointmentId: row.appointmentId,
      patientId: row.patientId,
      queueEntryId: row.queueId,
      fullName: row.patientName,
      age: this.computeAge(row.patientDateOfBirth),
      gender: row.patientGender,
      condition: row.reason ?? '',
      visitType: row.visitType,
      priority: row.priority,
      status: row.status,
      scheduledTime: row.scheduledAt.toISOString(),
      arrivedAt: row.arrivedAt?.toISOString() ?? null,
      waitingSince: row.waitingSince?.toISOString() ?? null,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      estimatedDurationMin: row.estimatedDurationMin ?? 30,
      roomNumber: row.roomNumber ?? null,
      notes: row.notes ?? '',
      hasAllergies: (allergyCounts.get(row.patientId) ?? 0) > 0,
      activeMedications: medicationCounts.get(row.patientId) ?? 0,
      vitalAlerts: vitalAlertCounts.get(row.patientId) ?? 0,
      phoneNumber: row.patientPhone ?? '',
      assignedDoctor: doctorNames.get(row.doctorId) ?? 'Unknown',
      assignedDoctorDepartment: row.doctorSpecialty ?? 'Cardiology',
    };
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

  private async batchAllergyCounts(
    patientIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (patientIds.length === 0) return map;

    for (const pid of patientIds) {
      const [row] = await this.db
        .select({ count: count() })
        .from(allergy)
        .innerJoin(patient, eq(allergy.userId, patient.userId))
        .where(eq(patient.id, pid));
      map.set(pid, row.count);
    }

    return map;
  }

  private async batchActiveMedicationCounts(
    patientIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (patientIds.length === 0) return map;

    for (const pid of patientIds) {
      const [row] = await this.db
        .select({ count: count() })
        .from(medication)
        .innerJoin(patient, eq(medication.userId, patient.userId))
        .where(and(eq(patient.id, pid), eq(medication.status, 'active')));
      map.set(pid, row.count);
    }

    return map;
  }

  private async batchVitalAlertCounts(
    patientIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (patientIds.length === 0) return map;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const pid of patientIds) {
      const [row] = await this.db
        .select({ count: count() })
        .from(vitalReading)
        .where(
          and(
            eq(vitalReading.patientId, pid),
            gte(vitalReading.createdAt, sevenDaysAgo),
            or(
              gte(vitalReading.systolicBp, 140),
              lte(vitalReading.systolicBp, 90),
              gte(vitalReading.heartRate, 100),
              lte(vitalReading.heartRate, 60),
              lte(vitalReading.oxygenSaturation, 94),
            ),
          ),
        );
      map.set(pid, row.count);
    }

    return map;
  }

  private async computeAvgWaitTime(
    todayStart: Date,
    todayEnd: Date,
  ): Promise<number> {
    const rows = await this.db
      .select({
        arrivedAt: patientQueue.arrivedAt,
        startedAt: patientQueue.startedAt,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
          or(
            eq(patientQueue.status, 'completed'),
            eq(patientQueue.status, 'in-consultation'),
          ),
        ),
      );

    let totalWait = 0;
    let counted = 0;

    for (const row of rows) {
      if (row.arrivedAt && row.startedAt) {
        totalWait += row.startedAt.getTime() - row.arrivedAt.getTime();
        counted += 1;
      }
    }

    return counted === 0 ? 0 : Math.round(totalWait / counted / 60000);
  }
}
