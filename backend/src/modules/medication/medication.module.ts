import { Module } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { PatientMedicationController } from './patient-medication.controller';
import { DoctorMedicationController } from './doctor-medication.controller';
import { AssistantMedicationController } from './assistant-medication.controller';
import { AssistantMedicationService } from './assistant-medication.service';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MinioModule, NotificationsModule],
  controllers: [
    PatientMedicationController,
    DoctorMedicationController,
    AssistantMedicationController,
  ],
  providers: [MedicationService, AssistantMedicationService],
})
export class MedicationModule {}
