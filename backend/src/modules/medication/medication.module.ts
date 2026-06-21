import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { MedicationService } from './medication.service';
import { PatientMedicationController } from './patient-medication.controller';
import { DoctorMedicationController } from './doctor-medication.controller';
import { AssistantMedicationController } from './assistant-medication.controller';
import { AssistantMedicationService } from './assistant-medication.service';
import { AssistantGuard } from '../assistant/assistant.guard';
import { MinioModule } from '../../shared/storage/minio.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
  ],
  controllers: [
    PatientMedicationController,
    DoctorMedicationController,
    AssistantMedicationController,
  ],
  providers: [
    MedicationService,
    AssistantMedicationService,
    PatientGuard,
    DoctorGuard,
    AssistantGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class MedicationModule {}
