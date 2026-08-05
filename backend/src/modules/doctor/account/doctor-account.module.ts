import { Module } from '@nestjs/common';

import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../../shared/storage/minio.module';
import { DoctorAccountController } from './doctor-account.controller';
import { DoctorAccountService } from './doctor-account.service';

@Module({
  imports: [DoctorVerifierModule, MinioModule],
  controllers: [DoctorAccountController],
  providers: [DoctorAccountService],
})
export class DoctorAccountModule {}
