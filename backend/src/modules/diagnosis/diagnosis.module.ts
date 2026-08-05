import { Module } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { DoctorDiagnosisController } from './doctor-diagnosis.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';

@Module({
  imports: [DoctorVerifierModule],
  controllers: [DoctorDiagnosisController],
  providers: [DiagnosisService],
})
export class DiagnosisModule {}
