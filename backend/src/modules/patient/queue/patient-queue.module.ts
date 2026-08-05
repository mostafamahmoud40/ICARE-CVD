import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { PatientGuard } from '../patient.guard';
import { PatientQueueController } from './patient-queue.controller';
import { PatientQueueService } from './patient-queue.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [PatientQueueController],
  providers: [
    PatientQueueService,
    PatientGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class PatientQueueModule {}
