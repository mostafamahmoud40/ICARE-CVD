import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { AssistantGuard } from '../assistant/assistant.guard';
import { AssistantMedicationService } from './assistant-medication.service';
import { MedicationService } from './medication.service';
import {
  CreateMedicationContactDto,
  CreateMedicationEscalationDto,
  CreateMedicationFlagDto,
  DismissMedicationInsightDto,
  ResolveMedicationFlagDto,
  UpdateMedicationInstructionsDto,
} from './dto/assistant-medication.dto';

@Controller('assistant/medications')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantMedicationController {
  constructor(
    private readonly service: AssistantMedicationService,
    private readonly medicationService: MedicationService,
  ) {}

  @Get('profiles')
  listProfiles() {
    return this.service.listMedicationProfiles();
  }

  @Get('profiles/:patientId')
  getProfile(@Param('patientId') patientId: string) {
    return this.service.getMedicationProfile(patientId);
  }

  @Post('flags')
  createFlag(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateMedicationFlagDto,
  ) {
    return this.service.createFlag(user.sub, dto);
  }

  @Patch('flags/:flagId/resolve')
  resolveFlag(
    @CurrentUser() user: TokenPayload,
    @Param('flagId') flagId: string,
    @Body() dto: ResolveMedicationFlagDto,
  ) {
    return this.service.resolveFlag(user.sub, flagId, dto.resolutionNote);
  }

  @Patch(':medicationId/instructions')
  updateInstructions(
    @Param('medicationId') medicationId: string,
    @Body() dto: UpdateMedicationInstructionsDto,
  ) {
    return this.service.updateInstructions(medicationId, dto.instructions);
  }

  @Post('contact-log')
  createContactLog(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateMedicationContactDto,
  ) {
    return this.service.createContactLog(user.sub, dto);
  }

  @Post('escalations')
  createEscalation(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateMedicationEscalationDto,
  ) {
    return this.service.createEscalation(user.sub, dto);
  }

  @Post('insights/:insightKey/dismiss')
  dismissInsight(
    @CurrentUser() user: TokenPayload,
    @Param('insightKey') insightKey: string,
    @Body() dto: DismissMedicationInsightDto,
  ) {
    return this.service.dismissInsight(user.sub, dto.patientId, insightKey);
  }

  @Get(':medicationId/adherence-record')
  getAdherenceRecord(@Param('medicationId') medicationId: string) {
    return this.medicationService.getMedicationAdherenceRecord(medicationId);
  }
}
