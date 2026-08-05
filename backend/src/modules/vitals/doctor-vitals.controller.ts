import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { DoctorGuard } from '../doctor/doctor.guard';
import { VitalsService } from './vitals.service';
import { CreateVitalReadingDto, UpdateVitalReadingDto } from './dto/vitals.dto';

@Controller('doctor/patients')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorVitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Get(':patientId/vitals')
  listVitals(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.vitalsService.listVitals(user.sub, patientId);
  }

  @Get(':patientId/vitals/stats')
  getVitalStats(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
  ) {
    return this.vitalsService.getVitalStats(user.sub, patientId);
  }

  @Get(':patientId/vitals/:vitalId')
  getVital(
    @CurrentUser() user: TokenPayload,
    @Param('vitalId') vitalId: string,
  ) {
    return this.vitalsService.getVital(user.sub, vitalId);
  }

  @Post(':patientId/vitals')
  createVital(
    @CurrentUser() user: TokenPayload,
    @Param('patientId') patientId: string,
    @Body() dto: CreateVitalReadingDto,
  ) {
    return this.vitalsService.createVital(user.sub, patientId, dto);
  }

  @Patch(':patientId/vitals/:vitalId')
  updateVital(
    @CurrentUser() user: TokenPayload,
    @Param('vitalId') vitalId: string,
    @Body() dto: UpdateVitalReadingDto,
  ) {
    return this.vitalsService.updateVital(user.sub, vitalId, dto);
  }

  @Delete(':patientId/vitals/:vitalId')
  deleteVital(
    @CurrentUser() user: TokenPayload,
    @Param('vitalId') vitalId: string,
  ) {
    return this.vitalsService.deleteVital(user.sub, vitalId);
  }
}
