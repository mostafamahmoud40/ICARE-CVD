import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { MedicationService } from './medication.service';
import {
  CreateMedicationDto,
  UpdateMedicationDto,
  ChangeMedicationStatusDto,
} from './dto/medication.dto';

@Controller('doctor/medications')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorMedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  /** GET /doctor/medications/stats — global medication stats */
  @Get('stats')
  getStats(@CurrentUser() user: TokenPayload) {
    return this.medicationService.getDoctorMedicationStats(user.sub);
  }

  /** GET /doctor/medications/patients — list all patients with medication counts */
  @Get('patients')
  listPatients(@CurrentUser() user: TokenPayload) {
    return this.medicationService.listDoctorPatients(user.sub);
  }

  /** GET /doctor/medications/patients/:patientId — list medications for a patient */
  @Get('patients/:patientId')
  listPatientMedications(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.medicationService.listPatientMedicationsForDoctor(
      user.sub,
      patientId,
    );
  }

  /** POST /doctor/medications/patients/:patientId — prescribe a new medication */
  @Post('patients/:patientId')
  createMedication(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateMedicationDto,
  ) {
    return this.medicationService.createMedicationForPatient(
      user.sub,
      patientId,
      dto,
    );
  }

  /** PATCH /doctor/medications/:id — update a medication */
  @Patch(':id')
  updateMedication(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationService.updateMedication(user.sub, id, dto);
  }

  /** PATCH /doctor/medications/:id/status — change status (pause/resume/discontinue) */
  @Patch(':id/status')
  changeStatus(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
    @Body() dto: ChangeMedicationStatusDto,
  ) {
    return this.medicationService.changeMedicationStatus(
      user.sub,
      id,
      dto.status,
    );
  }

  /** DELETE /doctor/medications/:id — delete a medication */
  @Delete(':id')
  deleteMedication(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.medicationService.deleteMedication(user.sub, id);
  }
}
