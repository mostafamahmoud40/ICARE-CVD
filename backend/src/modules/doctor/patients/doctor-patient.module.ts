import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { DoctorGuard } from '../doctor.guard';
import { DoctorPatientController } from './doctor-patient.controller';
import { DoctorPatientService } from './doctor-patient.service';
import { DoctorVerifierModule } from '../../../shared/doctor/doctor-verifier.module';
import { MinioModule } from '../../../shared/storage/minio.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    DoctorVerifierModule,
    MinioModule,
  ],
  controllers: [DoctorPatientController],
  providers: [
    DoctorPatientService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class DoctorPatientModule {}
