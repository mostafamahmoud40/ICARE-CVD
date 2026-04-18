import { Module } from '@nestjs/common';
import { DoctorVerifierService } from './doctor-verifier.service';

@Module({
  providers: [DoctorVerifierService],
  exports: [DoctorVerifierService],
})
export class DoctorVerifierModule {}
