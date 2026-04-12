import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';

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
}
