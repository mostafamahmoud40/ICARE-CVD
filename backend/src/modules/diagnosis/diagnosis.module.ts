import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { DiagnosisService } from './diagnosis.service';
import { DoctorDiagnosisController } from './doctor-diagnosis.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
  ],
  controllers: [DoctorDiagnosisController],
  providers: [DiagnosisService, DoctorGuard, AuthJwtService, AccessTokenGuard],
})
export class DiagnosisModule {}
