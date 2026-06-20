import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { MedicationService } from './medication.service';
import { PatientMedicationController } from './patient-medication.controller';
import { DoctorMedicationController } from './doctor-medication.controller';
import { MinioModule } from '../../shared/storage/minio.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
  ],
  controllers: [PatientMedicationController, DoctorMedicationController],
  providers: [
    MedicationService,
    PatientGuard,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class MedicationModule {}
