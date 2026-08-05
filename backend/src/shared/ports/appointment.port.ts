import type { AppointmentService } from '../../modules/appointment/appointment.service';
import type { CreateAppointmentDto } from '../../modules/appointment/dto/create-appointment.dto';
import type { UpdateAppointmentDto } from '../../modules/appointment/dto/update-appointment.dto';

export const APPOINTMENT_READER = Symbol('APPOINTMENT_READER');
export const APPOINTMENT_COMMANDS = Symbol('APPOINTMENT_COMMANDS');

/** Read-only appointment/clinic queries (ISP). */
export interface IAppointmentReader {
  listDoctors(): ReturnType<AppointmentService['listDoctors']>;
  listPatientAppointments(
    userId: number,
  ): ReturnType<AppointmentService['listPatientAppointments']>;
  getDoctorAvailability(
    doctorId: string,
    from?: string,
    days?: number,
  ): ReturnType<AppointmentService['getDoctorAvailability']>;
  findUpcomingByConfirmationCode(
    userId: number,
    confirmationCode: string,
  ): ReturnType<AppointmentService['findUpcomingByConfirmationCode']>;
}

/** Mutating appointment operations (ISP). */
export interface IAppointmentCommands {
  create(
    userId: number,
    dto: CreateAppointmentDto,
  ): ReturnType<AppointmentService['create']>;
  cancel(
    userId: number,
    appointmentId: string,
  ): ReturnType<AppointmentService['cancel']>;
  cancelAllUpcoming(
    userId: number,
  ): ReturnType<AppointmentService['cancelAllUpcoming']>;
  rescheduleByConfirmationCode(
    userId: number,
    confirmationCode: string,
    scheduledAt: string,
  ): ReturnType<AppointmentService['rescheduleByConfirmationCode']>;
  changeVisitTypeByConfirmationCode(
    userId: number,
    confirmationCode: string,
    visitType: 'clinic' | 'virtual',
  ): ReturnType<AppointmentService['changeVisitTypeByConfirmationCode']>;
  update(
    userId: number,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ): ReturnType<AppointmentService['update']>;
}
