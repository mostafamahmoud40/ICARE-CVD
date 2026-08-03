import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import { appointment, doctor, patient, user } from '../../database/schema';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../../shared/mail/mail.service';

export type AppointmentPatientNotifyEvent =
  | 'booked'
  | 'confirmed'
  | 'cancelled'
  | 'rescheduled'
  | 'completed';

type AppointmentRow = typeof appointment.$inferSelect;

@Injectable()
export class AppointmentPatientNotificationService {
  private readonly clinicTimeZone = 'Africa/Cairo';

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async notifyBooked(appointmentId: string, options?: { bookedBy?: 'clinic' }) {
    await this.dispatch(appointmentId, 'booked', options);
  }

  async notifyAfterUpdate(before: AppointmentRow, after: AppointmentRow) {
    if (before.status !== after.status) {
      if (after.status === 'cancelled') {
        await this.dispatch(after.id, 'cancelled');
        return;
      }
      if (after.status === 'confirmed') {
        await this.dispatch(after.id, 'confirmed');
        return;
      }
      if (after.status === 'completed') {
        await this.dispatch(after.id, 'completed');
        return;
      }
    }

    if (before.scheduledAt.getTime() !== after.scheduledAt.getTime()) {
      await this.dispatch(after.id, 'rescheduled');
    }
  }

  private async dispatch(
    appointmentId: string,
    event: AppointmentPatientNotifyEvent,
    options?: { bookedBy?: 'clinic' },
  ) {
    const ctx = await this.loadContext(appointmentId);
    if (!ctx) return;

    const when = this.formatWhen(ctx.scheduledAt);
    const doctorName = ctx.doctorName;
    const code = ctx.confirmationCode;

    let title: string;
    let body: string;

    switch (event) {
      case 'booked':
        title = 'Appointment booked';
        body =
          options?.bookedBy === 'clinic'
            ? `The clinic scheduled your visit with ${doctorName} on ${when}. Confirmation: ${code}.`
            : `Your visit with ${doctorName} on ${when} is scheduled. Confirmation: ${code}.`;
        break;
      case 'confirmed':
        title = 'Appointment confirmed';
        body = `Your appointment with ${doctorName} on ${when} is confirmed.`;
        break;
      case 'cancelled':
        title = 'Appointment cancelled';
        body = `Your appointment with ${doctorName} on ${when} (${code}) has been cancelled.`;
        break;
      case 'rescheduled':
        title = 'Appointment rescheduled';
        body = `Your visit with ${doctorName} has been moved to ${when}. Confirmation: ${code}.`;
        break;
      case 'completed':
        title = 'Visit completed';
        body = `Your appointment with ${doctorName} on ${when} is marked completed.`;
        break;
    }

    await this.notificationsService.dispatch({
      userId: ctx.patientUserId,
      kind: 'appointment',
      title,
      body,
      href: '/appointments',
      metadata: {
        appointmentId: ctx.appointmentId,
        event,
        confirmationCode: code,
      },
    });

    if (event === 'booked' && ctx.patientEmail) {
      try {
        await this.mailService.sendAppointmentBookedEmail(
          ctx.patientEmail,
          ctx.patientName,
          ctx.doctorName,
          when,
          ctx.visitType,
          ctx.reason,
          code,
        );
      } catch (err) {
        console.error(
          `Failed to send booking confirmation email to ${ctx.patientEmail}:`,
          err,
        );
      }
    }
  }

  private async loadContext(appointmentId: string) {
    const patientUser = alias(user, 'patient_user');
    const doctorUser = alias(user, 'doctor_user');

    const rows = await this.db
      .select({
        patientUserId: patient.userId,
        patientName: patientUser.name,
        patientEmail: patientUser.email,
        doctorName: doctorUser.name,
        confirmationCode: appointment.confirmationCode,
        scheduledAt: appointment.scheduledAt,
        appointmentId: appointment.id,
        visitType: appointment.visitType,
        reason: appointment.reason,
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
