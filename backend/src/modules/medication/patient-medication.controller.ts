import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { MedicationService } from './medication.service';

@Controller('patient/medications')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientMedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  /** GET /patient/medications — list all medications for the patient */
  @Get()
  listMedications(@CurrentUser() user: TokenPayload) {
    return this.medicationService.listPatientMedications(user.sub);
  }

  /** GET /patient/medications/:id — get a single medication */
  @Get(':id')
  getMedication(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.medicationService.getPatientMedication(user.sub, id);
  }

  /** GET /patient/medications/:id/logs — get dose log for a medication */
  @Get(':id/logs')
  getDoseLog(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.medicationService.getPatientDoseLog(user.sub, id);
  }

  /** POST /patient/medications/:id/take — mark medication as taken */
  @Post(':id/take')
  markAsTaken(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.medicationService.logDose(user.sub, id, false);
  }

  /** POST /patient/medications/:id/skip — mark medication as skipped */
  @Post(':id/skip')
  markAsSkipped(@CurrentUser() user: TokenPayload, @Param('id') id: string) {
    return this.medicationService.logDose(user.sub, id, true);
  }
}
