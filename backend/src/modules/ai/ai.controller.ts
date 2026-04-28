import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { AiService } from './ai.service';
import { PersistRegistrationSummaryDto } from './dto/persist-registration-summary.dto';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('registration-summary')
  @UseGuards(AccessTokenGuard, PatientGuard)
  getRegistrationSummary(@CurrentUser() currentUser: TokenPayload) {
    return this.aiService.getRegistrationSummary(currentUser.sub);
  }

  @Post('registration-summary')
  @UseGuards(AccessTokenGuard, PatientGuard)
  persistRegistrationSummary(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: PersistRegistrationSummaryDto,
  ) {
    return this.aiService.persistRegistrationSummary(
      currentUser.sub,
      dto.analysis,
    );
  }

  @Post('registration-analyze')
  @UseGuards(AccessTokenGuard, PatientGuard)
  registrationAnalyze(
    @CurrentUser() _currentUser: TokenPayload,
    @Body() dto: RegistrationAnalyzeDto,
  ) {
    return this.aiService.analyzeRegistration(dto);
  }
}
