import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { LabService } from './lab.service';
import {
  PatientLabReportDocumentDto,
  PatientLabReportUploadIntentDto,
  PatientSubmitLabReportDto,
} from './dto/lab.dto';

@Controller('patient/lab-orders')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientLabController {
  constructor(private readonly labService: LabService) {}

  @Get()
  listLabOrders(@CurrentUser() user: TokenPayload) {
    return this.labService.listPatientLabOrders(user.sub);
  }

  @Post(':orderId/upload-intent')
  createUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
    @Body() dto: PatientLabReportUploadIntentDto,
  ) {
    return this.labService.createPatientLabReportUploadIntent(
      user.sub,
      orderId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':orderId/documents')
  registerDocument(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
    @Body() dto: PatientLabReportDocumentDto,
  ) {
    return this.labService.createPatientLabReportDocument(
      user.sub,
      orderId,
      dto,
    );
  }

  @Post(':orderId/report')
  submitReport(
    @CurrentUser() user: TokenPayload,
    @Param('orderId') orderId: string,
    @Body() dto: PatientSubmitLabReportDto,
  ) {
    return this.labService.submitPatientLabReport(user.sub, orderId, dto);
  }
}

@Controller('patient/lab-results')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientLabResultsController {
  constructor(private readonly labService: LabService) {}

  @Get()
  listLabResults(@CurrentUser() user: TokenPayload) {
    return this.labService.listPatientLabResults(user.sub);
  }
}
