import { Module } from '@nestjs/common';

import { MinioModule } from '../../../shared/storage/minio.module';
import { ConsultationModule } from '../../consultation/consultation.module';
import { NotificationsModule } from '../../notifications/notifications.module';

import { DoctorQueueController } from './doctor-queue.controller';
import { DoctorQueueService } from './doctor-queue.service';

@Module({
  imports: [MinioModule, ConsultationModule, NotificationsModule],
  controllers: [DoctorQueueController],
  providers: [DoctorQueueService],
})
export class DoctorQueueModule {}
