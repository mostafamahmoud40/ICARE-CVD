import { Injectable } from '@nestjs/common';

import { AppointmentService } from './appointment.service';
import type { IAppointmentCommands } from '../../shared/ports/appointment.port';

@Injectable()
export class AppointmentCommandsService implements IAppointmentCommands {
  constructor(private readonly appointmentService: AppointmentService) {}

  create(...args: Parameters<AppointmentService['create']>) {
    return this.appointmentService.create(...args);
  }

  cancel(...args: Parameters<AppointmentService['cancel']>) {
    return this.appointmentService.cancel(...args);
  }

  cancelAllUpcoming(
    ...args: Parameters<AppointmentService['cancelAllUpcoming']>
  ) {
    return this.appointmentService.cancelAllUpcoming(...args);
  }

  rescheduleByConfirmationCode(
    ...args: Parameters<AppointmentService['rescheduleByConfirmationCode']>
  ) {
    return this.appointmentService.rescheduleByConfirmationCode(...args);
  }

  changeVisitTypeByConfirmationCode(
    ...args: Parameters<AppointmentService['changeVisitTypeByConfirmationCode']>
  ) {
    return this.appointmentService.changeVisitTypeByConfirmationCode(...args);
  }

  update(...args: Parameters<AppointmentService['update']>) {
    return this.appointmentService.update(...args);
  }
}
