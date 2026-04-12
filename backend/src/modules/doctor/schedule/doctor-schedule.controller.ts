import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';

import { DoctorGuard } from '../doctor.guard';
import { DoctorScheduleService } from './doctor-schedule.service';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';

@Controller('doctor')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorScheduleController {
  constructor(private readonly scheduleService: DoctorScheduleService) {}

  @Get('schedule')
  getSchedule(@CurrentUser() user: TokenPayload) {
    return this.scheduleService.getSchedule(user.sub);
  }

  @Put('schedule')
  upsertSchedule(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    return this.scheduleService.upsertSchedule(user.sub, dto);
  }

  @Delete('schedule')
  deleteSchedule(@CurrentUser() user: TokenPayload) {
    return this.scheduleService.deleteSchedule(user.sub);
  }
}
