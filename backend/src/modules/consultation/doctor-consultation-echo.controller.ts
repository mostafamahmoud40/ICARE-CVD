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
import { ConsultationEchoService } from './consultation-echo.service';
import {
  EchoUploadIntentDto,
  SaveConsultationEchoAnalysisDto,
  UpdateConsultationEchoReportDto,
} from './dto/consultation-echo.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationEchoController {
  constructor(private readonly echoService: ConsultationEchoService) {}

  @Get(':patientId/echo-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.echoService.listAnalyses(user.sub, patientId, consultationId);
  }

  @Post(':patientId/echo-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: EchoUploadIntentDto,
  ) {
    return this.echoService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/echo-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationEchoAnalysisDto,
  ) {
    return this.echoService.saveAnalysis(user.sub, patientId, dto);
  }

  @Patch(':patientId/echo-analyses/:analysisId/report')
  updateReport(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
    @Body() dto: UpdateConsultationEchoReportDto,
  ) {
    return this.echoService.updateReport(
      user.sub,
      patientId,
      analysisId,
      dto,
    );
  }

  @Delete(':patientId/echo-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.echoService.deleteAnalysis(user.sub, patientId, analysisId);
  }
}
