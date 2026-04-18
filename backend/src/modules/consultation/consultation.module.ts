import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { ConsultationService } from './consultation.service';
import { DoctorConsultationController } from './doctor-consultation.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [DoctorConsultationController],
  providers: [
    ConsultationService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class ConsultationModule {}
