import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { ConsultationModule } from '../../consultation/consultation.module';
import { PatientGuard } from '../patient.guard';
import { PatientConsultationController } from './patient-consultation.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    ConsultationModule,
  ],
  controllers: [PatientConsultationController],
  providers: [PatientGuard, AuthJwtService, AccessTokenGuard],
})
export class PatientConsultationModule {}
