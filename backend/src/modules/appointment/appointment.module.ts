import { Module } from '@nestjs/common';

import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import {
  APPOINTMENT_COMMANDS,
  APPOINTMENT_READER,
} from '../../shared/ports/appointment.port';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DoctorAvailabilityService } from './doctor-availability.service';
import { AppointmentCommandsService } from './appointment-commands.service';
import { AppointmentReaderService } from './appointment-reader.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentPatientNotificationService } from './appointment-patient-notification.service';
import { AppointmentAssistantNotificationService } from './appointment-assistant-notification.service';
import { AppointmentDoctorNotificationService } from './appointment-doctor-notification.service';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';

@Module({
  imports: [DoctorVerifierModule, MinioModule, NotificationsModule],
  controllers: [AppointmentController, DoctorAppointmentController],
  providers: [
    AppointmentService,
    DoctorAvailabilityService,
    AppointmentReaderService,
    AppointmentCommandsService,
    { provide: APPOINTMENT_READER, useExisting: AppointmentReaderService },
    { provide: APPOINTMENT_COMMANDS, useExisting: AppointmentCommandsService },
    AppointmentPatientNotificationService,
    AppointmentAssistantNotificationService,
    AppointmentDoctorNotificationService,
    DoctorAppointmentService,
  ],
  exports: [
    AppointmentService,
    APPOINTMENT_READER,
    APPOINTMENT_COMMANDS,
    AppointmentPatientNotificationService,
    AppointmentAssistantNotificationService,
    AppointmentDoctorNotificationService,
  ],
})
export class AppointmentModule {}
