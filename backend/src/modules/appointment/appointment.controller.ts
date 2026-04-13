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
import { PatientGuard } from '../patient/patient.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('patient/appointments')
@UseGuards(AccessTokenGuard, PatientGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get('doctors')
  listDoctors() {
    return this.appointmentService.listDoctors();
  }

  @Get('doctors/:doctorId/availability')
  getDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Query('from') from?: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? Number(days) : undefined;
    return this.appointmentService.getDoctorAvailability(
      doctorId,
      from,
      Number.isFinite(parsedDays) ? parsedDays : undefined,
    );
  }

  @Get()
  listPatientAppointments(@CurrentUser() user: TokenPayload) {
    return this.appointmentService.listPatientAppointments(user.sub);
  }

  @Post()
  create(@CurrentUser() user: TokenPayload, @Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.update(user.sub, id, dto);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.appointmentService.cancel(user.sub, id);
  }
}
