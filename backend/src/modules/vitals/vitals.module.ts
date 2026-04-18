import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { VitalsService } from './vitals.service';
import { DoctorVitalsController } from './doctor-vitals.controller';
import { DoctorVerifierModule } from '../../shared/doctor/doctor-verifier.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
  ],
  controllers: [DoctorVitalsController],
  providers: [VitalsService, DoctorGuard, AuthJwtService, AccessTokenGuard],
})
export class VitalsModule {}
