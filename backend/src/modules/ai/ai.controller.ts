import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { AiService } from './ai.service';
import { PatientAiChatService } from './patient-ai-chat.service';
import { DoctorAiChatService } from './doctor-ai-chat.service';
import { PersistRegistrationSummaryDto } from './dto/persist-registration-summary.dto';
import { RegistrationAnalyzeDto } from './dto/registration-analyze.dto';
import { PatientAiChatDto } from './dto/patient-ai-chat.dto';
import { DoctorAiChatDto } from './dto/doctor-ai-chat.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly patientAiChatService: PatientAiChatService,
    private readonly doctorAiChatService: DoctorAiChatService,
  ) {}

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

  /** POST /ai/chat — patient conversational AI with appointment tools */
  @Post('chat')
  @UseGuards(AccessTokenGuard, PatientGuard)
  patientChat(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: PatientAiChatDto,
  ) {
    return this.patientAiChatService.chat(currentUser.sub, dto);
  }

  /** POST /ai/doctor/chat — doctor clinical AI over full patient panel */
  @Post('doctor/chat')
  @UseGuards(AccessTokenGuard, DoctorGuard)
  doctorChat(
    @CurrentUser() currentUser: TokenPayload,
    @Body() dto: DoctorAiChatDto,
  ) {
    return this.doctorAiChatService.chat(currentUser.sub, dto);
  }
}
