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
import { ConsultationXrayService } from './consultation-xray.service';
import {
  SaveConsultationXrayAnalysisDto,
  XrayUploadIntentDto,
} from './dto/consultation-xray.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationXrayController {
  constructor(private readonly xrayService: ConsultationXrayService) {}

  @Get(':patientId/xray-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.xrayService.listAnalyses(user.sub, patientId, consultationId);
  }

  @Post(':patientId/xray-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: XrayUploadIntentDto,
  ) {
    return this.xrayService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/xray-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationXrayAnalysisDto,
  ) {
    return this.xrayService.saveAnalysis(user.sub, patientId, dto);
  }

  @Delete(':patientId/xray-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.xrayService.deleteAnalysis(user.sub, patientId, analysisId);
  }
}
