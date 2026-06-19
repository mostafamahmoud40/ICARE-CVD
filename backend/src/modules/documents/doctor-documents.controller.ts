import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { DoctorDocumentService } from './doctor-documents.service';
import { CreateDocumentDto, LabReportUploadIntentDto } from './dto/documents.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorDocumentsController {
  constructor(private readonly service: DoctorDocumentService) {}

  @Get(':patientId/documents')
  listDocuments(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.service.listDocuments(user.sub, patientId);
  }

  @Post(':patientId/documents/upload-intent')
  createLabReportUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: LabReportUploadIntentDto,
  ) {
    return this.service.createLabReportUploadIntent(
      user.sub,
      patientId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':patientId/documents')
  createDocument(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.service.createDocument(user.sub, patientId, dto);
  }

  @Delete(':patientId/documents/:documentId')
  deleteDocument(
    @CurrentUser() user: TokenPayload,
    @Param('documentId') documentId: string,
  ) {
    return this.service.deleteDocument(user.sub, documentId);
  }
}
