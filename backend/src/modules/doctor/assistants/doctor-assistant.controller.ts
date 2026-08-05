import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import {
  PatientAvatarUploadIntentDto,
  SetPatientAvatarDto,
} from '../../assistant/dto/patient-avatar.dto';
import { DoctorGuard } from '../doctor.guard';
import { DoctorAssistantService } from './doctor-assistant.service';
import {
  CreateDoctorAssistantDto,
  UpdateDoctorAssistantDto,
} from './dto/doctor-assistant.dto';
import { UpdateDoctorAssistantShiftsDto } from './dto/doctor-assistant-shifts.dto';

@Controller('doctor/assistants')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorAssistantController {
  constructor(private readonly service: DoctorAssistantService) {}

  @Get()
  listAssistants(@CurrentUser() user: TokenPayload) {
    return this.service.listAssistants(user.sub);
  }

  @Post()
  createAssistant(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateDoctorAssistantDto,
  ) {
    return this.service.createAssistant(user.sub, dto);
  }

  @Patch(':assistantUserId')
  updateAssistant(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
    @Body() dto: UpdateDoctorAssistantDto,
  ) {
    return this.service.updateAssistant(user.sub, assistantUserId, dto);
  }

  @Post(':assistantUserId/avatar/upload-intent')
  createAvatarUploadIntent(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
    @Body() dto: PatientAvatarUploadIntentDto,
  ) {
    return this.service.createAvatarUploadIntent(
      user.sub,
      assistantUserId,
      dto.fileName,
      dto.contentType,
    );
  }

  @Patch(':assistantUserId/avatar')
  setAvatar(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
    @Body() dto: SetPatientAvatarDto,
  ) {
    return this.service.setAvatar(user.sub, assistantUserId, dto.s3Key);
  }

  @Delete(':assistantUserId')
  removeAssistant(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
  ) {
    return this.service.removeAssistant(user.sub, assistantUserId);
  }

  @Patch(':assistantUserId/status')
  updateAssistantStatus(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.service.updateAssistantStatus(
      user.sub,
      assistantUserId,
      isActive,
    );
  }

  @Get(':assistantUserId/shifts')
  getAssistantShifts(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
  ) {
    return this.service.getAssistantShifts(user.sub, assistantUserId);
  }

  @Patch(':assistantUserId/shifts')
  updateAssistantShifts(
    @CurrentUser() user: TokenPayload,
    @Param('assistantUserId', ParseIntPipe) assistantUserId: number,
    @Body() dto: UpdateDoctorAssistantShiftsDto,
  ) {
    return this.service.updateAssistantShifts(user.sub, assistantUserId, dto);
  }
}
