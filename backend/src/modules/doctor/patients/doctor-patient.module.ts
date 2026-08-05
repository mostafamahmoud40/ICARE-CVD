import { Module } from '@nestjs/common';
import { DoctorPatientController } from './doctor-patient.controller';
import { DoctorPatientService } from './doctor-patient.service';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../../shared/storage/minio.module';

@Module({
  imports: [DoctorVerifierModule, MinioModule],
  controllers: [DoctorPatientController],
  providers: [DoctorPatientService],
})
export class DoctorPatientModule {}
