import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { DoctorAppointmentController } from './doctor-appointment.controller';
import { DoctorAppointmentService } from './doctor-appointment.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
  ],
  controllers: [AppointmentController, DoctorAppointmentController],
  providers: [
    AppointmentService,
    DoctorAppointmentService,
    PatientGuard,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class AppointmentModule {}
