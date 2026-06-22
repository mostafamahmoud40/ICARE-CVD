import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, gte, inArray, lte, ne, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import {
  allergy,
  appointment,
  doctor,
  medication,
  patient,
  patientQueue,
  user,
  vitalReading,
} from '../../../database/schema';
import type { NewPatientQueueRow } from '../../../database/schema/patientQueue.schema';
import type {
  QueueFilter,
  QueuePriority,
  QueueStatus,
} from './dto/doctor-queue.dto';
import { AvatarUrlResolver } from '../../../shared/storage/avatar-url.resolver';
import { QueueNotificationService } from '../../notifications/queue-notification.service';

@Injectable()
export class DoctorQueueService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly avatarUrlResolver: AvatarUrlResolver,
    private readonly queueNotifications: QueueNotificationService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Stats                                                              */
  /* ------------------------------------------------------------------ */

  async getStats(doctorId: string) {
    const { todayStart, todayEnd } = this.todayBounds();
    await this.ensureTodayQueueEntries(doctorId, todayStart, todayEnd);

    const baseFilter = and(
      eq(appointment.doctorId, doctorId),
      gte(appointment.scheduledAt, todayStart),
      lte(appointment.scheduledAt, todayEnd),
    );

    const statusCounts = async (status: QueueStatus) => {
      const [row] = await this.db
        .select({ count: count() })
        .from(patientQueue)
        .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
        .where(and(baseFilter, eq(patientQueue.status, status)));
      return row.count;
    };

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(baseFilter);

    const avgWait = await this.computeAvgWaitTime(
      doctorId,
      todayStart,
      todayEnd,
    );
    const currentWait = await this.computeCurrentWait(
      doctorId,
      todayStart,
      todayEnd,
    );

    return {
      totalToday: totalRow.count,
      scheduled: await statusCounts('scheduled'),
      arrived: await statusCounts('arrived'),
      inWaiting: await statusCounts('waiting'),
      inConsultation: await statusCounts('in-consultation'),
      reportPending: await statusCounts('report-pending'),
      completed: await statusCounts('completed'),
      noShow: await statusCounts('no-show'),
      avgWaitMin: avgWait,
      currentWaitMin: currentWait,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  List / Get                                                         */
  /* ------------------------------------------------------------------ */

  async listQueueEntries(doctorId: string, filter?: QueueFilter) {
    const { todayStart, todayEnd } = this.todayBounds();
    await this.ensureTodayQueueEntries(doctorId, todayStart, todayEnd);
    const conditions = this.buildFilterConditions(
      doctorId,
      filter,
      todayStart,
      todayEnd,
    );

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
        patientAvatarUrl: patient.avatarUrl,
        patientUserAvatarUrl: user.avatarUrl,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE ${patientQueue.priority}
          WHEN 'emergency' THEN 0
          WHEN 'urgent' THEN 1
          ELSE 2
        END`,
        appointment.scheduledAt,
      );

    const patientIds = [...new Set(rows.map((r) => r.patientId))];
    const allergyCounts = await this.batchAllergyCounts(patientIds);
    const medicationCounts = await this.batchActiveMedicationCounts(patientIds);
    const vitalAlertCounts = await this.batchVitalAlertCounts(patientIds);

    return Promise.all(
      rows.map(async (row) => {
        const avatarUrl = await this.resolveStoredAvatarUrl(
          row.patientAvatarUrl,
          row.patientUserAvatarUrl,
        );
        return this.formatQueueEntry(
          row,
          allergyCounts,
          medicationCounts,
          vitalAlertCounts,
          avatarUrl,
        );
      }),
    );
  }

  async getQueueEntry(doctorId: string, queueId: string) {
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
        patientAvatarUrl: patient.avatarUrl,
        patientUserAvatarUrl: user.avatarUrl,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(user, eq(patient.userId, user.id))
      .where(
        and(eq(appointment.doctorId, doctorId), eq(patientQueue.id, queueId)),
      )
      .limit(1);

    if (!rows.length) throw new NotFoundException('Queue entry not found');

    const row = rows[0];
    const allergyCounts = await this.batchAllergyCounts([row.patientId]);
    const medicationCounts = await this.batchActiveMedicationCounts([
      row.patientId,
    ]);
    const vitalAlertCounts = await this.batchVitalAlertCounts([row.patientId]);

    const avatarUrl = await this.resolveStoredAvatarUrl(
      row.patientAvatarUrl,
      row.patientUserAvatarUrl,
    );

    return this.formatQueueEntry(
      row,
      allergyCounts,
      medicationCounts,
      vitalAlertCounts,
      avatarUrl,
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Update status                                                      */
  /* ------------------------------------------------------------------ */

  async updateStatus(doctorId: string, queueId: string, status: QueueStatus) {
    const existing = await this.db
      .select({
        id: patientQueue.id,
        appointmentId: patientQueue.appointmentId,
        status: patientQueue.status,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(eq(appointment.doctorId, doctorId), eq(patientQueue.id, queueId)),
      )
      .limit(1);

    if (!existing.length) throw new NotFoundException('Queue entry not found');

    const previousStatus = existing[0].status;
    const appointmentId = existing[0].appointmentId;

    const now = new Date();
    const { todayStart, todayEnd } = this.todayBounds();

    if (status === 'in-consultation') {
      const others = await this.db
        .select({ id: patientQueue.id })
        .from(patientQueue)
        .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
        .where(
          and(
            eq(appointment.doctorId, doctorId),
            gte(appointment.scheduledAt, todayStart),
            lte(appointment.scheduledAt, todayEnd),
            eq(patientQueue.status, 'in-consultation'),
            ne(patientQueue.id, queueId),
          ),
        );

      if (others.length > 0) {
        await this.db
          .update(patientQueue)
          .set({ status: 'report-pending', updatedAt: now })
          .where(
            inArray(
              patientQueue.id,
              others.map((row) => row.id),
            ),
          );
      }
    }

    const updates: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    if (status === 'arrived') updates.arrivedAt = now;
    if (status === 'waiting') updates.waitingSince = now;
    if (status === 'in-consultation') updates.startedAt = now;
    if (status === 'completed') updates.completedAt = now;

    await this.db
      .update(patientQueue)
      .set(updates)
      .where(eq(patientQueue.id, queueId));

    if (status === 'completed') {
      await this.db
        .update(appointment)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(appointment.id, appointmentId));
    } else if (status === 'cancelled') {
      await this.db
        .update(appointment)
        .set({ status: 'cancelled', cancelledAt: now, updatedAt: now })
        .where(eq(appointment.id, appointmentId));
    }

    void this.queueNotifications
      .notifyAfterStatusChange(queueId, previousStatus, status)
      .catch(() => undefined);

    return this.getQueueEntry(doctorId, queueId);
  }

  /* ------------------------------------------------------------------ */
  /*  Update queue metadata                                              */
  /* ------------------------------------------------------------------ */

  async updateEntry(
    doctorId: string,
    queueId: string,
    dto: {
      priority?: QueuePriority;
      roomNumber?: string;
      notes?: string;
      estimatedDurationMin?: number;
    },
  ) {
    const existing = await this.db
      .select({ id: patientQueue.id })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(eq(appointment.doctorId, doctorId), eq(patientQueue.id, queueId)),
      )
      .limit(1);

    if (!existing.length) throw new NotFoundException('Queue entry not found');

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

    return this.getQueueEntry(doctorId, queueId);
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

  private async ensureTodayQueueEntries(
    doctorId: string,
    todayStart: Date,
    todayEnd: Date,
  ) {
    const todayAppointments = await this.db
      .select({ id: appointment.id })
      .from(appointment)
      .where(
        and(
          eq(appointment.doctorId, doctorId),
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
          eq(appointment.doctorId, doctorId),
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

  private buildFilterConditions(
    doctorId: string,
    filter: QueueFilter | undefined,
    todayStart: Date,
    todayEnd: Date,
  ) {
    const conditions = [
      eq(appointment.doctorId, doctorId),
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
          eq(patientQueue.status, 'report-pending'),
        )!,
      );
    } else if (filter === 'scheduled') {
      conditions.push(eq(patientQueue.status, 'scheduled'));
    } else if (filter === 'completed') {
      conditions.push(eq(patientQueue.status, 'completed'));
    } else if (filter === 'no-show') {
      conditions.push(
        or(
          eq(patientQueue.status, 'no-show'),
          eq(patientQueue.status, 'cancelled'),
        )!,
      );
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
      patientAvatarUrl: string | null;
      patientUserAvatarUrl: string | null;
    },
    allergyCounts: Map<string, number>,
    medicationCounts: Map<string, number>,
    vitalAlertCounts: Map<string, number>,
    avatarUrl: string | null,
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
      avatarUrl,
    };
  }

  private async resolveStoredAvatarUrl(
    primary: string | null | undefined,
    fallback: string | null | undefined,
  ): Promise<string | null> {
    const raw = primary?.trim() || fallback?.trim() || null;
    if (!raw) return null;
    return this.avatarUrlResolver.resolve(raw);
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
    doctorId: string,
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
          eq(appointment.doctorId, doctorId),
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

  private async computeCurrentWait(
    doctorId: string,
    todayStart: Date,
    todayEnd: Date,
  ): Promise<number> {
    const [row] = await this.db
      .select({ waitingSince: patientQueue.waitingSince })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .where(
        and(
          eq(appointment.doctorId, doctorId),
          gte(appointment.scheduledAt, todayStart),
          lte(appointment.scheduledAt, todayEnd),
          eq(patientQueue.status, 'waiting'),
        ),
      )
      .orderBy(patientQueue.waitingSince)
      .limit(1);

    if (!row?.waitingSince) return 0;
    return Math.round((Date.now() - row.waitingSince.getTime()) / 60000);
  }
}
