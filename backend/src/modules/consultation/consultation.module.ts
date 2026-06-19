import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { ConsultationService } from './consultation.service';
import { ConsultationXrayService } from './consultation-xray.service';
import { ConsultationEchoService } from './consultation-echo.service';
import { ConsultationEcgService } from './consultation-ecg.service';
import { DoctorConsultationController } from './doctor-consultation.controller';
import { DoctorConsultationXrayController } from './doctor-consultation-xray.controller';
import { DoctorConsultationEchoController } from './doctor-consultation-echo.controller';
import { DoctorConsultationEcgController } from './doctor-consultation-ecg.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../shared/storage/minio.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
    MinioModule,
  ],
  controllers: [
    DoctorConsultationController,
    DoctorConsultationXrayController,
    DoctorConsultationEchoController,
    DoctorConsultationEcgController,
  ],
  providers: [
    ConsultationService,
    ConsultationXrayService,
    ConsultationEchoService,
    ConsultationEcgService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
  exports: [ConsultationService],
})
export class ConsultationModule {}
