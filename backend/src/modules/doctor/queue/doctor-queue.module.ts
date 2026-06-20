import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';
import { MinioModule } from '../../../shared/storage/minio.module';
import { ConsultationModule } from '../../consultation/consultation.module';

import { DoctorGuard } from '../doctor.guard';
import { DoctorQueueController } from './doctor-queue.controller';
import { DoctorQueueService } from './doctor-queue.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
    ConsultationModule,
  ],
  controllers: [DoctorQueueController],
  providers: [
    DoctorQueueService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class DoctorQueueModule {}
