import { Injectable } from '@nestjs/common';

import { AppointmentService } from './appointment.service';
import type { IAppointmentReader } from '../../shared/ports/appointment.port';

@Injectable()
export class AppointmentReaderService implements IAppointmentReader {
  constructor(private readonly appointmentService: AppointmentService) {}

  listDoctors(...args: Parameters<AppointmentService['listDoctors']>) {
    return this.appointmentService.listDoctors(...args);
  }

  listPatientAppointments(
    ...args: Parameters<AppointmentService['listPatientAppointments']>
  ) {
    return this.appointmentService.listPatientAppointments(...args);
  }

  getDoctorAvailability(
    ...args: Parameters<AppointmentService['getDoctorAvailability']>
  ) {
    return this.appointmentService.getDoctorAvailability(...args);
  }

  findUpcomingByConfirmationCode(
    ...args: Parameters<AppointmentService['findUpcomingByConfirmationCode']>
  ) {
    return this.appointmentService.findUpcomingByConfirmationCode(...args);
  }
}
