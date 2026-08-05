import { Module } from '@nestjs/common';

import { DoctorScheduleController } from './doctor-schedule.controller';
import { DoctorScheduleRevisionService } from './doctor-schedule-revision.service';
import { DoctorScheduleService } from './doctor-schedule.service';

@Module({
  imports: [],
  controllers: [DoctorScheduleController],
  providers: [DoctorScheduleService, DoctorScheduleRevisionService],
  exports: [DoctorScheduleService],
})
export class DoctorScheduleModule {}
