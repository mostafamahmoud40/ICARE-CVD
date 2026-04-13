import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';

import { DoctorGuard } from '../doctor.guard';
import { DoctorScheduleService } from './doctor-schedule.service';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import {
  CreateBlockedDateDto,
  CreateBlockedDatesBatchDto,
} from './dto/blocked-date.dto';

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

  // ========== Blocked Dates Endpoints ==========

  @Get('schedule/blocked-dates')
  getBlockedDates(@CurrentUser() user: TokenPayload) {
    return this.scheduleService.getBlockedDates(user.sub);
  }

  @Post('schedule/blocked-dates')
  addBlockedDate(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateBlockedDateDto,
  ) {
    return this.scheduleService.addBlockedDate(user.sub, dto);
  }

  @Post('schedule/blocked-dates/batch')
  addBlockedDatesBatch(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateBlockedDatesBatchDto,
  ) {
    return this.scheduleService.addBlockedDatesBatch(user.sub, dto);
  }

  @Delete('schedule/blocked-dates/:date')
  removeBlockedDate(
    @CurrentUser() user: TokenPayload,
    @Param('date') date: string,
  ) {
    return this.scheduleService.removeBlockedDate(user.sub, date);
  }

  @Delete('schedule/blocked-dates')
  clearAllBlockedDates(@CurrentUser() user: TokenPayload) {
    return this.scheduleService.clearAllBlockedDates(user.sub);
  }
}
