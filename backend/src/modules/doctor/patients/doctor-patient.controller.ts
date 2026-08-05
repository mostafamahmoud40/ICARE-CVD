import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { DoctorGuard } from '../doctor.guard';
import { DoctorPatientService } from './doctor-patient.service';
import { AssignPatientDto } from './dto/doctor-patient.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorPatientController {
  constructor(private readonly service: DoctorPatientService) {}

  @Get()
  listPatients(@CurrentUser() user: TokenPayload) {
    return this.service.listDoctorPatients(user.sub);
  }

  @Get('stats')
  getStats(@CurrentUser() user: TokenPayload) {
    return this.service.getDoctorPatientStats(user.sub);
  }

  @Get(':patientId')
  getPatientFullRecord(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.service.getPatientFullRecord(user.sub, patientId);
  }

  @Post(':patientId/assign')
  assignPatient(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: AssignPatientDto,
  ) {
    return this.service.assignPatient(user.sub, patientId, dto.notes);
  }
}
