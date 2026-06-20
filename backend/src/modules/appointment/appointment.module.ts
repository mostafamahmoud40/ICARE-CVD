import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentPatientNotificationService } from './appointment-patient-notification.service';
import { AppointmentAssistantNotificationService } from './appointment-assistant-notification.service';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
    NotificationsModule,
  ],
  controllers: [AppointmentController, DoctorAppointmentController],
  providers: [
    AppointmentService,
    AppointmentPatientNotificationService,
    AppointmentAssistantNotificationService,
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
  ],
})
export class AppointmentModule {}
