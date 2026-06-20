import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { MinioModule } from '../../../shared/storage/minio.module';
import { PatientGuard } from '../patient.guard';
import { PatientAccountController } from './patient-account.controller';
import { PatientAccountService } from './patient-account.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
  ],
  controllers: [PatientAccountController],
  providers: [PatientAccountService, PatientGuard, AuthJwtService, AccessTokenGuard],
})
export class PatientAccountModule {}
