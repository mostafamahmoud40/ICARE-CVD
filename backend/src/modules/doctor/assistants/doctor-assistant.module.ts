import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { DoctorGuard } from '../doctor.guard';
import { DoctorAssistantController } from './doctor-assistant.controller';
import { DoctorAssistantService } from './doctor-assistant.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
  ],
  controllers: [DoctorAssistantController],
  providers: [
    DoctorAssistantService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class DoctorAssistantModule {}
