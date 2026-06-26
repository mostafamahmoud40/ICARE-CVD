import { Module } from '@nestjs/common';
import { LabService } from './lab.service';
import { DoctorLabController } from './doctor-lab.controller';
import {
  PatientLabController,
  PatientLabResultsController,
} from './patient-lab.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DoctorVerifierModule, MinioModule, NotificationsModule],
  controllers: [
    DoctorLabController,
    PatientLabController,
    PatientLabResultsController,
  ],
  providers: [LabService],
})
export class LabModule {}
