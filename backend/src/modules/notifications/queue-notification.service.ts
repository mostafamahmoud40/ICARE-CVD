import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import {
  appointment,
  doctor,
  patient,
  patientQueue,
  user,
} from '../../database/schema';
import { NotificationsService } from './notifications.service';

type QueueStatus = typeof patientQueue.$inferSelect['status'];

const patientUser = alias(user, 'patient_user');
const doctorUser = alias(user, 'doctor_user');

@Injectable()
export class QueueNotificationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  async notifyAfterAdd(queueId: string) {
    const ctx = await this.loadContext(queueId);
    if (!ctx) return;

    const title =
      ctx.priority === 'urgent' ? 'Urgent patient in queue' : 'Patient added to queue';
    const body =
      ctx.priority === 'urgent'
        ? `${ctx.patientName} was added to your queue with urgent priority.`
        : `${ctx.patientName} was added to your queue.`;

    await Promise.all([
      this.notificationsService.dispatch({
        userId: ctx.doctorUserId,
        kind: 'queue',
        title,
        body,
        href: '/doctor-queue',
        metadata: { queueId, patientId: ctx.patientId, priority: ctx.priority },
      }),
      ...this.assistantTargets(ctx).map((userId) =>
        this.notificationsService.dispatch({
          userId,
          kind: 'queue',
          title: 'Patient checked in',
          body: `${ctx.patientName} was added to ${ctx.doctorName}'s queue.`,
          href: '/assistant-queue',
          metadata: { queueId, patientId: ctx.patientId },
        }),
      ),
    ]);
  }

  async notifyAfterStatusChange(
    queueId: string,
    previousStatus: QueueStatus,
    newStatus: QueueStatus,
  ) {
    if (previousStatus === newStatus) return;

    const ctx = await this.loadContext(queueId);
    if (!ctx) return;

    if (newStatus === 'arrived' || newStatus === 'waiting') {
      await this.notificationsService.dispatch({
        userId: ctx.doctorUserId,
        kind: 'queue',
        title: 'Patient waiting',
        body: `${ctx.patientName} is ${newStatus === 'arrived' ? 'checked in' : 'waiting'} for consultation.`,
        href: '/doctor-queue',
        metadata: { queueId, patientId: ctx.patientId, status: newStatus },
      });
      return;
    }

    if (newStatus === 'in-consultation') {
      await this.notificationsService.dispatch({
        userId: ctx.patientUserId,
        kind: 'queue',
        title: 'Consultation started',
        body: `Dr. ${ctx.doctorName} is ready to see you now.`,
        href: '/patient-dashboard',
        metadata: { queueId, status: newStatus },
      });
      return;
    }

    if (newStatus === 'completed') {
      await this.notificationsService.dispatch({
        userId: ctx.patientUserId,
        kind: 'queue',
        title: 'Visit completed',
        body: `Your consultation with Dr. ${ctx.doctorName} is complete.`,
        href: '/consultations',
        metadata: { queueId, status: newStatus },
      });
    }
  }

  private assistantTargets(ctx: { assistantUserIds: number[] }) {
    return ctx.assistantUserIds;
  }

  private async loadContext(queueId: string) {
    const rows = await this.db
      .select({
        queueId: patientQueue.id,
        patientId: patient.id,
        patientUserId: patient.userId,
        patientName: patientUser.name,
        doctorUserId: doctor.userId,
        doctorName: doctorUser.name,
        priority: patientQueue.priority,
        status: patientQueue.status,
      })
      .from(patientQueue)
      .innerJoin(appointment, eq(patientQueue.appointmentId, appointment.id))
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(patientUser, eq(patient.userId, patientUser.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .innerJoin(doctorUser, eq(doctor.userId, doctorUser.id))
      .where(eq(patientQueue.id, queueId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const assistantUserIds = await this.listActiveAssistantUserIds();

    return { ...row, assistantUserIds };
  }

  private async listActiveAssistantUserIds() {
    const rows = await this.db
      .select({ userId: user.id })
      .from(user)
      .where(and(eq(user.role, 'assistant'), eq(user.isActive, true)));

    return rows.map((row) => row.userId);
  }
}
