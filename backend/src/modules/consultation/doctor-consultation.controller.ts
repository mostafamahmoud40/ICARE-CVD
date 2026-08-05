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
import { ConsultationService } from './consultation.service';
import {
  CreateConsultationDto,
  UpdateConsultationDto,
  LinkDiagnosisDto,
  LinkPrescriptionDto,
  UpdateLinkPrescriptionDto,
  CreateReferralDto,
} from './dto/consultation.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Get(':patientId/consultations')
  listConsultations(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.consultationService.listConsultations(user.sub, patientId);
  }

  @Get(':patientId/consultations/:consultationId')
  getConsultation(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
  ) {
    return this.consultationService.getConsultation(user.sub, consultationId);
  }

  @Post(':patientId/consultations')
  createConsultation(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateConsultationDto,
  ) {
    return this.consultationService.createConsultation(
      user.sub,
      patientId,
      dto,
    );
  }

  @Patch(':patientId/consultations/:consultationId')
  updateConsultation(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.consultationService.updateConsultation(
      user.sub,
      consultationId,
      dto,
    );
  }

  @Delete(':patientId/consultations/:consultationId')
  deleteConsultation(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Param('consultationId') consultationId: string,
  ) {
    return this.consultationService.deleteConsultation(
      user.sub,
      patientId,
      consultationId,
    );
  }

  @Post(':patientId/consultations/:consultationId/diagnoses')
  linkDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Body() dto: LinkDiagnosisDto,
  ) {
    return this.consultationService.linkDiagnosis(
      user.sub,
      consultationId,
      dto,
    );
  }

  @Delete(':patientId/consultations/:consultationId/diagnoses/:diagnosisId')
  unlinkDiagnosis(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Param('diagnosisId') diagnosisId: string,
  ) {
    return this.consultationService.unlinkDiagnosis(
      user.sub,
      consultationId,
      diagnosisId,
    );
  }

  @Post(':patientId/consultations/:consultationId/prescriptions')
  linkPrescription(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Body() dto: LinkPrescriptionDto,
  ) {
    return this.consultationService.linkPrescription(
      user.sub,
      consultationId,
      dto,
    );
  }

  @Patch(':patientId/consultations/:consultationId/prescriptions/:medicationId')
  updateLinkedPrescription(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Param('medicationId') medicationId: string,
    @Body() dto: UpdateLinkPrescriptionDto,
  ) {
    return this.consultationService.updateLinkedPrescription(
      user.sub,
      consultationId,
      medicationId,
      dto,
    );
  }

  @Post(':patientId/consultations/:consultationId/referrals')
  addReferral(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Param('patientId') patientId: string,
    @Body() dto: CreateReferralDto,
  ) {
    return this.consultationService.addReferral(
      user.sub,
      consultationId,
      patientId,
      dto,
    );
  }

  @Delete(':patientId/consultations/:consultationId/referrals/:referralId')
  deleteReferral(
    @CurrentUser() user: TokenPayload,
    @Param('consultationId') consultationId: string,
    @Param('referralId') referralId: string,
  ) {
    return this.consultationService.deleteReferral(
      user.sub,
      consultationId,
      referralId,
    );
  }
}
