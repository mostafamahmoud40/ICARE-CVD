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
import { DoctorGuard } from '../doctor.guard';
import { DoctorAssistantService } from './doctor-assistant.service';
import {
  CreateDoctorAssistantDto,
  UpdateDoctorAssistantDto,
} from './dto/doctor-assistant.dto';

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
    return this.service.updateAssistantStatus(user.sub, assistantUserId, isActive);
  }
}
