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
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto, UpdateDiagnosisDto } from './dto/diagnosis.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorDiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Get(':patientId/diagnoses')
  listDiagnoses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.diagnosisService.listDiagnoses(user.sub, patientId);
  }

  @Get(':patientId/diagnoses/:diagnosisId')
  getDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.diagnosisService.getDiagnosis(user.sub, diagnosisId);
  }

  @Post(':patientId/diagnoses')
  createDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateDiagnosisDto,
  ) {
    return this.diagnosisService.createDiagnosis(user.sub, patientId, dto);
  }

  @Patch(':patientId/diagnoses/:diagnosisId')
  updateDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('diagnosisId') diagnosisId: string,
    @Body() dto: UpdateDiagnosisDto,
  ) {
    return this.diagnosisService.updateDiagnosis(user.sub, diagnosisId, dto);
  }

  @Delete(':patientId/diagnoses/:diagnosisId')
  deleteDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.diagnosisService.deleteDiagnosis(user.sub, diagnosisId);
  }
}
