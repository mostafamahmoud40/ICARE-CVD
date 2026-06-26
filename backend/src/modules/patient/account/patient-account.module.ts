import { Module } from '@nestjs/common';

import { MinioModule } from '../../../shared/storage/minio.module';
import { PatientAccountController } from './patient-account.controller';
import { PatientAccountService } from './patient-account.service';

@Module({
  imports: [MinioModule],
  controllers: [PatientAccountController],
  providers: [PatientAccountService],
})
export class PatientAccountModule {}
