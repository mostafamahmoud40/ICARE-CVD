import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { ConsultationService } from '../../consultation/consultation.service';
import { PatientGuard } from '../patient.guard';

@Controller('patient/consultations')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get()
  listConsultations(@CurrentUser() user: TokenPayload) {
    return this.consultationService.listPatientConsultations(user.sub);
  }

  @Get(':consultationId')
  getConsultation(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
  ) {
    return this.consultationService.getPatientConsultation(
      user.sub,
      consultationId,
    );
  }
}
