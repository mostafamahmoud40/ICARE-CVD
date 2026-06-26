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
import { AssistantGuard } from './assistant.guard';
import { AssistantAppointmentService } from './assistant-appointment.service';
import {
  CreateAssistantAppointmentDto,
  PatchAssistantAppointmentDto,
  UpdateAppointmentStatusDto,
} from './dto/create-appointment.dto';

@Controller('assistant/appointments')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantAppointmentController {
  constructor(private readonly service: AssistantAppointmentService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('doctors')
  listDoctors() {
    return this.service.listDoctors();
  }

  @Get('patients')
  listPatients() {
    return this.service.listPatients();
  }

  @Get()
  listAppointments() {
    return this.service.listAppointments();
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.service.getAvailableSlots(doctorId, date);
  }

  @Get(':appointmentId')
  getAppointment(@Param('appointmentId') appointmentId: string) {
    return this.service.getAppointment(appointmentId);
  }

  @Post()
  createAppointment(@Body() dto: CreateAssistantAppointmentDto) {
    return this.service.createAppointment(dto);
  }

  @Patch(':appointmentId/status')
  updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.updateStatus(appointmentId, dto.status);
  }

  @Patch(':appointmentId')
  patchAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: PatchAssistantAppointmentDto,
  ) {
    return this.service.patchAppointment(appointmentId, dto);
  }
}
