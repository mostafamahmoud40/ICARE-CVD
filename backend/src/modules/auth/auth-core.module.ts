import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminGuard } from '../admin/admin.guard';
import { AssistantGuard } from '../assistant/assistant.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { PatientGuard } from '../patient/patient.guard';
import { AccessTokenGuard } from './access-token.guard';
import { AuthJwtService } from './jwt';

/**
 * Global auth primitives — single registration (DIP).
 * Feature modules must not re-register JwtModule or auth guards.
 */
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  providers: [
    AuthJwtService,
    AccessTokenGuard,
    PatientGuard,
    DoctorGuard,
    AdminGuard,
    AssistantGuard,
  ],
  exports: [
    JwtModule,
    AuthJwtService,
    AccessTokenGuard,
    PatientGuard,
    DoctorGuard,
    AdminGuard,
    AssistantGuard,
  ],
})
export class AuthCoreModule {}
