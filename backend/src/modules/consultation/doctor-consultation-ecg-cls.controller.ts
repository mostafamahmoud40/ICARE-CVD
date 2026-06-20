import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { ConsultationEcgClsService } from './consultation-ecg-cls.service';
import {
  EcgClsUploadIntentDto,
  SaveConsultationEcgClsAnalysisDto,
} from './dto/consultation-ecg-cls.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationEcgClsController {
  constructor(private readonly ecgClsService: ConsultationEcgClsService) {}

  @Get(':patientId/ecg-cls-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.ecgClsService.listAnalyses(user.sub, patientId, consultationId);
  }

  @Post(':patientId/ecg-cls-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: EcgClsUploadIntentDto,
  ) {
    return this.ecgClsService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/ecg-cls-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationEcgClsAnalysisDto,
  ) {
    return this.ecgClsService.saveAnalysis(user.sub, patientId, dto);
  }

  @Delete(':patientId/ecg-cls-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.ecgClsService.deleteAnalysis(user.sub, patientId, analysisId);
  }
}
