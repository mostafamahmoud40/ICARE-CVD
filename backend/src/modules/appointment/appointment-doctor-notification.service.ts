import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, user } from '../../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

export type AppointmentDoctorNotifyEvent =
  | 'patient_booked'
  | 'patient_cancelled'
  | 'patient_rescheduled'
  | 'patient_confirmed'
  | 'patient_completed';

type AppointmentRow = typeof appointment.$inferSelect;

const patientUser = alias(user, 'patient_user');
const doctorUser = alias(user, 'doctor_user');

@Injectable()
export class AppointmentDoctorNotificationService {
  private readonly clinicTimeZone = 'Africa/Cairo';

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  async notifyPatientBooked(appointmentId: string) {
    await this.dispatch(appointmentId, 'patient_booked');
  }

  async notifyAfterPatientUpdate(
    before: AppointmentRow,
    after: AppointmentRow,
  ) {
    if (before.status !== after.status) {
      if (after.status === 'cancelled') {
        await this.dispatch(after.id, 'patient_cancelled');
        return;
      }
      if (after.status === 'confirmed') {
        await this.dispatch(after.id, 'patient_confirmed');
        return;
      }
      if (after.status === 'completed') {
        await this.dispatch(after.id, 'patient_completed');
        return;
      }
    }

    if (before.scheduledAt.getTime() !== after.scheduledAt.getTime()) {
      await this.dispatch(after.id, 'patient_rescheduled');
    }
  }

  private async dispatch(
    appointmentId: string,
    event: AppointmentDoctorNotifyEvent,
  ) {
    const ctx = await this.loadContext(appointmentId);
    if (!ctx) return;

    const when = this.formatWhen(ctx.scheduledAt);
    const patientName = ctx.patientName;
    const code = ctx.confirmationCode;

    let title: string;
    let body: string;

    switch (event) {
      case 'patient_booked':
        title = 'New appointment booked';
        body = `${patientName} booked a visit on ${when}. Confirmation: ${code}.`;
        break;
      case 'patient_confirmed':
        title = 'Appointment confirmed';
        body = `${patientName} confirmed the visit on ${when}.`;
        break;
      case 'patient_cancelled':
        title = 'Appointment cancelled';
        body = `${patientName} cancelled the visit on ${when} (${code}).`;
        break;
      case 'patient_rescheduled':
        title = 'Appointment rescheduled';
        body = `${patientName} moved the visit to ${when}. Confirmation: ${code}.`;
        break;
      case 'patient_completed':
        title = 'Visit completed';
        body = `${patientName}'s appointment on ${when} was marked completed.`;
        break;
    }

    await this.notificationsService.dispatch({
      userId: ctx.doctorUserId,
      kind: 'appointment',
      title,
      body,
      href: '/doctor-appointments',
      metadata: {
        appointmentId: ctx.appointmentId,
        event,
        confirmationCode: code,
        patientName,
      },
    });
  }

  private async loadContext(appointmentId: string) {
    const rows = await this.db
      .select({
        doctorUserId: doctor.userId,
        patientName: patientUser.name,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        appointmentId: appointment.id,
      })
      .from(appointment)
      .innerJoin(patient, eq(appointment.patientId, patient.id))
      .innerJoin(patientUser, eq(patient.userId, patientUser.id))
      .innerJoin(doctor, eq(appointment.doctorId, doctor.id))
      .innerJoin(doctorUser, eq(doctor.userId, doctorUser.id))
      .where(eq(appointment.id, appointmentId))
      .limit(1);

    return rows[0] ?? null;
  }

  private formatWhen(scheduledAt: Date) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: this.clinicTimeZone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(scheduledAt);
  }
}
