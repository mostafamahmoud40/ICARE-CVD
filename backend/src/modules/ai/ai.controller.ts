import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { AiService } from './ai.service';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('registration-analyze')
  @UseGuards(AccessTokenGuard, PatientGuard)
  registrationAnalyze(
    @CurrentUser() _currentUser: TokenPayload,
    @Body() dto: RegistrationAnalyzeDto,
  ) {
    return this.aiService.analyzeRegistration(dto);
  }
}
