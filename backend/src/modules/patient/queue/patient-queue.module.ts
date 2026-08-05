import { Module } from '@nestjs/common';

import { PatientQueueController } from './patient-queue.controller';
import { PatientQueueService } from './patient-queue.service';

@Module({
  imports: [],
  controllers: [PatientQueueController],
  providers: [PatientQueueService],
})
export class PatientQueueModule {}
