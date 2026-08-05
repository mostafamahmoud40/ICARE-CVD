import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { VitalsService } from './vitals.service';
import { DoctorVitalsController } from './doctor-vitals.controller';
import { PatientVitalsController } from './patient-vitals.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';

@Module({
  imports: [DoctorVerifierModule, NotificationsModule],
  controllers: [DoctorVitalsController, PatientVitalsController],
  providers: [VitalsService],
})
export class VitalsModule {}
