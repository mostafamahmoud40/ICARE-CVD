import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { DoctorGuard } from '../doctor.guard';
import { DoctorPatientService } from './doctor-patient.service';
import { AssignPatientDto } from './dto/doctor-patient.dto';
import {
  CreatePatientCareGoalDto,
  CreatePatientClinicalNoteDto,
  UpdatePatientCareGoalDto,
} from './dto/patient-profile-extras.dto';
import { UpdateDoctorPatientProfileDto } from './dto/update-doctor-patient-profile.dto';
import { CreatePatientAllergyDto } from './dto/patient-allergy.dto';

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

  @Patch(':patientId')
  updatePatientProfile(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: UpdateDoctorPatientProfileDto,
  ) {
    return this.service.updatePatientProfile(user.sub, patientId, dto);
  }

  @Post(':patientId/assign')
  assignPatient(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: AssignPatientDto,
  ) {
    return this.service.assignPatient(user.sub, patientId, dto.notes);
  }

  @Post(':patientId/clinical-notes')
  createClinicalNote(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientClinicalNoteDto,
  ) {
    return this.service.createClinicalNote(user.sub, patientId, dto);
  }

  @Delete(':patientId/clinical-notes/:noteId')
  deleteClinicalNote(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.service.deleteClinicalNote(user.sub, patientId, noteId);
  }

  @Post(':patientId/care-goals')
  createCareGoal(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientCareGoalDto,
  ) {
    return this.service.createCareGoal(user.sub, patientId, dto);
  }

  @Patch(':patientId/care-goals/:goalId')
  updateCareGoal(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('goalId') goalId: string,
    @Body() dto: UpdatePatientCareGoalDto,
  ) {
    return this.service.updateCareGoal(user.sub, patientId, goalId, dto);
  }

  @Delete(':patientId/care-goals/:goalId')
  deleteCareGoal(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('goalId') goalId: string,
  ) {
    return this.service.deleteCareGoal(user.sub, patientId, goalId);
  }

  @Post(':patientId/allergies')
  createAllergy(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreatePatientAllergyDto,
  ) {
    return this.service.createPatientAllergy(user.sub, patientId, dto);
  }

  @Delete(':patientId/allergies/:allergyId')
  deleteAllergy(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('allergyId') allergyId: string,
  ) {
    return this.service.deletePatientAllergy(user.sub, patientId, allergyId);
  }
}
