import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { DoctorAppointmentService } from './doctor-appointment.service';
import {
  CreateDoctorAppointmentDto,
  UpdateDoctorAppointmentDto,
} from './dto/doctor-appointment.dto';

@Controller('doctor/appointments')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorAppointmentController {
  constructor(private readonly service: DoctorAppointmentService) {}

  @Get('stats')
  getStats(@CurrentUser() user: TokenPayload) {
    return this.service.getStats(user.sub);
  }

  @Get()
  listAppointments(
    @CurrentUser() user: TokenPayload,
    @Query('filter') filter?: string,
  ) {
    const validFilters = ['all', 'today', 'upcoming', 'completed', 'cancelled'];
    const safeFilter = validFilters.includes(filter ?? '')
      ? (filter as 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled')
      : 'all';
    return this.service.listAppointments(user.sub, safeFilter);
  }

  @Get('available-slots')
  getAvailableSlots(
    @CurrentUser() user: TokenPayload,
    @Query('date') date: string,
    @Query('excludeAppointmentId') excludeAppointmentId?: string,
  ) {
    return this.service.getAvailableSlots(user.sub, date, excludeAppointmentId);
  }

  @Post()
  createAppointment(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateDoctorAppointmentDto,
  ) {
    return this.service.createAppointment(user.sub, dto);
  }

  @Get(':appointmentId')
  getAppointment(
    @CurrentUser() user: TokenPayload,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.service.getAppointment(user.sub, appointmentId);
  }

  @Patch(':appointmentId')
  updateAppointment(
    @CurrentUser() user: TokenPayload,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateDoctorAppointmentDto,
  ) {
    return this.service.updateAppointment(user.sub, appointmentId, dto);
  }

  @Patch(':appointmentId/cancel')
  cancelAppointment(
    @CurrentUser() user: TokenPayload,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.service.cancelAppointment(user.sub, appointmentId);
  }

  @Patch(':appointmentId/complete')
  completeAppointment(
    @CurrentUser() user: TokenPayload,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.service.completeAppointment(user.sub, appointmentId);
  }

  @Patch(':appointmentId/no-show')
  markNoShow(
    @CurrentUser() user: TokenPayload,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.service.markNoShow(user.sub, appointmentId);
  }
}
