import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { UpdateDoctorScheduleDto } from '../doctor/schedule/dto/update-doctor-schedule.dto';

import { AssistantDoctorScheduleService } from './assistant-doctor-schedule.service';
import { AssistantDoctorsService } from './assistant-doctors.service';
import { AssistantGuard } from './assistant.guard';
import { CreateScheduleDayExtraDto } from './dto/schedule-day-extra.dto';
import { SetDoctorArrivalDto } from './dto/set-doctor-arrival.dto';
import { ScheduleAiAnalyzeDto, ScheduleAiChatDto } from './dto/schedule-ai-chat.dto';

@Controller('assistant/doctors')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantDoctorScheduleController {
  constructor(
    private readonly service: AssistantDoctorScheduleService,
    private readonly doctorsService: AssistantDoctorsService,
  ) {}

  @Get('directory')
  listDoctorDirectory(@CurrentUser() _user: TokenPayload) {
    return this.doctorsService.listDirectory();
  }

  @Get(':doctorId/clinic-profile')
  getDoctorClinicProfile(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
  ) {
    return this.doctorsService.getClinicProfile(doctorId);
  }

  @Get(':doctorId/schedule')
  getScheduleBundle(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
  ) {
    return this.service.getScheduleBundle(doctorId);
  }

  @Put(':doctorId/schedule')
  upsertSchedule(
    @CurrentUser() user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ) {
    return this.service.upsertSchedule(doctorId, dto, user.sub);
  }

  @Get(':doctorId/schedule/revisions')
  listScheduleRevisions(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Query('limit') limit?: string,
  ) {
    const parsed = limit ? Number(limit) : undefined;
    return this.service.listScheduleRevisions(
      doctorId,
      Number.isFinite(parsed) ? parsed : undefined,
    );
  }

  @Get(':doctorId/schedule/revisions/:revisionId')
  getScheduleRevision(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Param('revisionId') revisionId: string,
  ) {
    return this.service.getScheduleRevision(doctorId, revisionId);
  }

  @Patch(':doctorId/schedule/paused-periods/:periodId')
  togglePausedPeriod(
    @CurrentUser() user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Param('periodId') periodId: string,
  ) {
    return this.service.togglePausedPeriod(doctorId, periodId, user.sub);
  }

  @Patch(':doctorId/schedule/arrival')
  setDoctorArrival(
    @CurrentUser() user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Body() dto: SetDoctorArrivalDto,
  ) {
    return this.service.setDoctorArrival(doctorId, dto, user.sub);
  }

  @Get(':doctorId/schedule/day-extras')
  listDayExtras(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listDayExtras(doctorId, from, to);
  }

  @Post(':doctorId/schedule/day-extras')
  createDayExtra(
    @CurrentUser() user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Body() dto: CreateScheduleDayExtraDto,
  ) {
    return this.service.createDayExtra(doctorId, dto, user.sub);
  }

  @Delete(':doctorId/schedule/day-extras/:extraId')
  deleteDayExtra(
    @CurrentUser() user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Param('extraId') extraId: string,
  ) {
    return this.service.deleteDayExtra(doctorId, extraId, user.sub);
  }

  @Post(':doctorId/schedule/ai/chat')
  scheduleAiChat(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Body() dto: ScheduleAiChatDto,
  ) {
    return this.service.chatAboutSchedule(
      doctorId,
      dto.doctorName,
      dto.message,
      dto.history ?? [],
    );
  }

  @Post(':doctorId/schedule/ai/analyze')
  scheduleAiAnalyze(
    @CurrentUser() _user: TokenPayload,
    @Param('doctorId') doctorId: string,
    @Body() dto: ScheduleAiAnalyzeDto,
  ) {
    return this.service.analyzeSchedule(doctorId, dto.doctorName);
  }
}
