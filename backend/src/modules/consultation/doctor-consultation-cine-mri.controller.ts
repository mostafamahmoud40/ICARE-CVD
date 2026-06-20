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
import { ConsultationCineMriService } from './consultation-cine-mri.service';
import {
  CineMriUploadIntentDto,
  SaveConsultationCineMriAnalysisDto,
} from './dto/consultation-cine-mri.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationCineMriController {
  constructor(private readonly cineMriService: ConsultationCineMriService) {}

  @Get(':patientId/cine-mri-analyses')
  listAnalyses(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Query('consultationId') consultationId?: string,
  ) {
    return this.cineMriService.listAnalyses(
      user.sub,
      patientId,
      consultationId,
    );
  }

  @Post(':patientId/cine-mri-analyses/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CineMriUploadIntentDto,
  ) {
    return this.cineMriService.createUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/cine-mri-analyses')
  saveAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: SaveConsultationCineMriAnalysisDto,
  ) {
    return this.cineMriService.saveAnalysis(user.sub, patientId, dto);
  }

  @Delete(':patientId/cine-mri-analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.cineMriService.deleteAnalysis(
      user.sub,
      patientId,
      analysisId,
    );
  }
}
