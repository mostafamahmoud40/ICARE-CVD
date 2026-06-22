import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentPatientNotificationService } from './appointment-patient-notification.service';
import { AppointmentAssistantNotificationService } from './appointment-assistant-notification.service';
import { AppointmentDoctorNotificationService } from './appointment-doctor-notification.service';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
    MinioModule,
    NotificationsModule,
  ],
  controllers: [AppointmentController, DoctorAppointmentController],
  providers: [
    AppointmentService,
    AppointmentPatientNotificationService,
    AppointmentAssistantNotificationService,
    AppointmentDoctorNotificationService,
    DoctorAppointmentService,
    PatientGuard,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
  exports: [
    AppointmentService,
    AppointmentPatientNotificationService,
    AppointmentAssistantNotificationService,
    AppointmentDoctorNotificationService,
  ],
})
export class AppointmentModule {}
