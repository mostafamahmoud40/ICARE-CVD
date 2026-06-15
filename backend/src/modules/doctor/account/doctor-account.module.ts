import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { DoctorGuard } from '../doctor.guard';
import { DoctorAccountController } from './doctor-account.controller';
import { DoctorAccountService } from './doctor-account.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
  ],
  controllers: [DoctorAccountController],
  providers: [
    DoctorAccountService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class DoctorAccountModule {}
