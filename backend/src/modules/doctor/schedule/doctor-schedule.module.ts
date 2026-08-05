import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { AuthJwtService } from '../../auth/jwt';

import { DoctorGuard } from '../doctor.guard';
import { DoctorScheduleController } from './doctor-schedule.controller';
import { DoctorScheduleRevisionService } from './doctor-schedule-revision.service';
import { DoctorScheduleService } from './doctor-schedule.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [DoctorScheduleController],
  providers: [
    DoctorScheduleService,
    DoctorScheduleRevisionService,
    DoctorGuard,
    AuthJwtService,
    AccessTokenGuard,
  ],
  exports: [DoctorScheduleService],
})
export class DoctorScheduleModule {}
