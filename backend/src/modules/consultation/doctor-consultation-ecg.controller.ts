import {
  Body,
  Controller,
  Delete,
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
import { ConsultationEcgService } from './consultation-ecg.service';
import {
  EcgUploadIntentDto,
  SaveConsultationEcgAnalysisDto,
  UpdateConsultationEcgReportDto,
} from './dto/consultation-ecg.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationEcgController {
  constructor(private readonly ecgService: ConsultationEcgService) {}

  @Get(':patientId/ecg-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.ecgService.listAnalyses(user.sub, patientId, consultationId);
  }

  @Post(':patientId/ecg-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: EcgUploadIntentDto,
  ) {
    return this.ecgService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/ecg-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationEcgAnalysisDto,
  ) {
    return this.ecgService.saveAnalysis(user.sub, patientId, dto);
  }

  @Patch(':patientId/ecg-analyses/:analysisId/report')
  updateReport(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
    @Body() dto: UpdateConsultationEcgReportDto,
  ) {
    return this.ecgService.updateReport(user.sub, patientId, analysisId, dto);
  }

  @Delete(':patientId/ecg-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.ecgService.deleteAnalysis(user.sub, patientId, analysisId);
  }
}
