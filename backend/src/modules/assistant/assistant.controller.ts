import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { CreateDocumentDto } from '../documents/dto/documents.dto';

import { AssistantGuard } from './assistant.guard';
import { AssistantService } from './assistant.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('assistant')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('patients')
  listPatients(@CurrentUser() _user: TokenPayload) {
    return this.assistantService.listPatients();
  }

  @Post('patients')
  createPatient(
    @CurrentUser() _user: TokenPayload,
    @Body() dto: CreatePatientDto,
  ) {
    return this.assistantService.createPatient(dto);
  }

  @Post('patients/:patientId/documents')
  registerPatientDocument(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.assistantService.registerPatientDocument(patientId, user.sub, {
      fileName: dto.fileName,
      contentType: dto.contentType,
      category: dto.category,
      title: dto.title,
      s3Key: dto.s3Key ?? '',
      fileSize: dto.fileSize,
    });
  }
}
