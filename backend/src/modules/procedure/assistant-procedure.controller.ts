import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { AssistantGuard } from '../assistant/assistant.guard';
import { DoctorGuard } from '../doctor/doctor.guard';
import { ProcedureService } from './procedure.service';
import {
  CreateProcedureRequirementDto,
  SaveProcedureConsentDto,
  ToggleProcedureRequirementDto,
  UpdateProcedureRequirementDto,
} from './dto/procedure.dto';

@Controller('assistant/procedures')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantProcedureController {
  constructor(private readonly procedureService: ProcedureService) {}

  @Get()
  listOrders() {
    return this.procedureService.listAssistantOrders();
  }

  @Get('stats')
  getStats() {
    return this.procedureService.getAssistantStats();
  }

  @Get('schedule')
  listSchedule(@Query('date') date?: string, @Query('search') search?: string) {
    const day = date?.trim() || new Date().toISOString().slice(0, 10);
    return this.procedureService.listSchedule(day, search);
  }

  @Get('history')
  listHistory(
    @Query('range') range?: string,
    @Query('search') search?: string,
  ) {
    return this.procedureService.listHistory(range?.trim() || '30days', search);
  }

  @Patch(':orderId/requirements/:requirementId')
  updateRequirement(
    @Param('orderId') orderId: string,
    @Param('requirementId') requirementId: string,
    @Body() body: ToggleProcedureRequirementDto & UpdateProcedureRequirementDto,
  ) {
    if (body.isDone !== undefined && body.title === undefined) {
      return this.procedureService.toggleRequirement(
        orderId,
        requirementId,
        body.isDone,
      );
    }
    return this.procedureService.editRequirement(orderId, requirementId, body);
  }

  @Post(':orderId/requirements/:requirementId/attachment')
  @UseInterceptors(FileInterceptor('file'))
  uploadRequirementAttachment(
    @Param('orderId') orderId: string,
    @Param('requirementId') requirementId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.procedureService.uploadRequirementAttachment(
      orderId,
      requirementId,
      file,
    );
  }

  @Post(':orderId/requirements')
  addRequirement(
    @Param('orderId') orderId: string,
    @Body() dto: CreateProcedureRequirementDto,
  ) {
    return this.procedureService.addRequirement(orderId, dto);
  }

  @Delete(':orderId/requirements/:requirementId')
  deleteRequirement(
    @Param('orderId') orderId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.procedureService.deleteRequirement(orderId, requirementId);
  }

  @Post(':orderId/notify-patient')
  notifyPatient(@Param('orderId') orderId: string) {
    return this.procedureService.notifyPatient(orderId);
  }

  @Post(':orderId/consent')
  @UseInterceptors(FileInterceptor('file'))
  saveConsent(
    @Param('orderId') orderId: string,
    @Body('consent') consentRaw: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!consentRaw?.trim()) {
      throw new BadRequestException('Consent payload is required');
    }
    const dto = JSON.parse(consentRaw) as SaveProcedureConsentDto;
    return this.procedureService.saveConsent(orderId, dto, file);
  }
}

@Controller('doctor/procedures')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorProcedureController {
  constructor(private readonly procedureService: ProcedureService) {}

  @Get()
  listOrders(@CurrentUser() user: TokenPayload) {
    return this.procedureService.listDoctorOrders(user.sub);
  }
}
