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
import { ConsultationCtService } from './consultation-ct.service';
import {
  CtUploadIntentDto,
  SaveConsultationCtAnalysisDto,
} from './dto/consultation-ct.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationCtController {
  constructor(private readonly ctService: ConsultationCtService) {}

  @Get(':patientId/ct-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.ctService.listAnalyses(user.sub, patientId, consultationId);
  }

  @Post(':patientId/ct-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CtUploadIntentDto,
  ) {
    return this.ctService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/ct-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationCtAnalysisDto,
  ) {
    return this.ctService.saveAnalysis(user.sub, patientId, dto);
  }

  @Delete(':patientId/ct-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.ctService.deleteAnalysis(user.sub, patientId, analysisId);
  }
}
