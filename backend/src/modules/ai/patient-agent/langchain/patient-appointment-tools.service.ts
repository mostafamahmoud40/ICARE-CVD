import { Injectable } from '@nestjs/common';

import { AppointmentService } from '../../../appointment/appointment.service';
import { ClinicIndexerService } from '../../chroma/clinic-indexer.service';
import type { PatientAiChatResponse, PatientAgentAction } from '../../dto/patient-ai-chat.dto';

export type ToolExecutionResult = {
  data: unknown;
  booking?: PatientAiChatResponse['booking'];
  appointmentsUpdated?: boolean;
};

@Injectable()
export class PatientAppointmentToolsService {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly clinicIndexer: ClinicIndexerService,
  ) {}

  formatAgentAction(toolName: string, data: unknown): PatientAgentAction {
    const payload =
      data && typeof data === 'object'
        ? (data as Record<string, unknown>)
        : {};
    const success = payload.success === true;
    const error =
      typeof payload.error === 'string' ? payload.error : undefined;
    const message =
      typeof payload.message === 'string' ? payload.message : undefined;

    const labels: Record<string, string> = {
      book_appointment: 'Book appointment',
      cancel_appointment: 'Cancel appointment',
      cancel_all_appointments: 'Cancel all appointments',
      reschedule_appointment: 'Reschedule appointment',
      change_visit_type: 'Change visit type',
    };

    return {
      tool: toolName,
      label: labels[toolName] ?? toolName,
      status: success ? 'success' : 'error',
      detail: message ?? error,
    };
  }

  async execute(
    name: string,
    args: Record<string, string>,
    userId: number,
  ): Promise<ToolExecutionResult> {
    try {
      if (name === 'book_appointment') {
        const { doctorId, scheduledAt, visitType, reason } = args;
        if (!doctorId || !scheduledAt || !visitType || !reason) {
          return { data: { error: 'Missing required booking fields' } };
        }
        if (visitType !== 'clinic' && visitType !== 'virtual') {
          return { data: { error: 'visitType must be clinic or virtual' } };
        }
        const created = await this.appointmentService.create(userId, {
          doctorId,
          scheduledAt,
          visitType: visitType as 'clinic' | 'virtual',
          reason: reason.slice(0, 1500),
        });
        const doctors = await this.appointmentService.listDoctors();
        const doc = doctors.find((d) => d.id === doctorId);
        const bookingResult = {
          confirmationCode: created.confirmationCode,
          scheduledAt: created.scheduledAt,
          doctorName: doc?.name ?? 'Your doctor',
          visitType: created.visitType,
        };
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            ...bookingResult,
            message: `Booked ${bookingResult.confirmationCode}`,
          },
          booking: bookingResult,
          appointmentsUpdated: true,
        };
      }

      if (name === 'cancel_appointment') {
        const code = args.confirmationCode?.trim();
        if (!code) return { data: { error: 'confirmationCode required' } };
        const appt =
          await this.appointmentService.findUpcomingByConfirmationCode(
            userId,
            code,
          );
        const result = await this.appointmentService.cancel(userId, appt.id);
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: result.confirmationCode,
            message: `Cancelled ${result.confirmationCode}`,
          },
          appointmentsUpdated: true,
        };
      }

      if (name === 'cancel_all_appointments') {
        const result = await this.appointmentService.cancelAllUpcoming(userId);
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            cancelledCount: result.cancelledCount,
            confirmationCodes: result.confirmationCodes,
            message:
              result.cancelledCount === 0
                ? 'No upcoming appointments to cancel'
                : `Cancelled ${result.cancelledCount} appointment(s)`,
          },
          appointmentsUpdated: result.cancelledCount > 0,
        };
      }

      if (name === 'reschedule_appointment') {
        const code = args.confirmationCode?.trim();
        const scheduledAt = args.scheduledAt?.trim();
        if (!code || !scheduledAt) {
          return {
            data: { error: 'confirmationCode and scheduledAt required' },
          };
        }
        const updated =
          await this.appointmentService.rescheduleByConfirmationCode(
            userId,
            code,
            scheduledAt,
          );
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: updated.confirmationCode,
            scheduledAt: updated.scheduledAt,
            message: `Rescheduled ${updated.confirmationCode} to ${updated.scheduledAt}`,
          },
          appointmentsUpdated: true,
        };
      }

      if (name === 'change_visit_type') {
        const code = args.confirmationCode?.trim();
        const visitType = args.visitType?.trim();
        if (!code || !visitType) {
          return { data: { error: 'confirmationCode and visitType required' } };
        }
        if (visitType !== 'clinic' && visitType !== 'virtual') {
          return { data: { error: 'visitType must be clinic or virtual' } };
        }
        const updated =
          await this.appointmentService.changeVisitTypeByConfirmationCode(
            userId,
            code,
            visitType as 'clinic' | 'virtual',
          );
        void this.refreshAppointmentIndex(userId);
        return {
          data: {
            success: true,
            confirmationCode: updated.confirmationCode,
            visitType: updated.visitType,
            message: `${updated.confirmationCode} is now ${updated.visitType}`,
          },
          appointmentsUpdated: true,
        };
      }

      return { data: { error: `Unknown tool: ${name}` } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Action failed';
      return { data: { error: msg } };
    }
  }

  private refreshAppointmentIndex(userId: number): void {
    void this.clinicIndexer.indexPatientAppointments(userId);
    void this.clinicIndexer.indexDoctorsAndSchedules();
  }
}
