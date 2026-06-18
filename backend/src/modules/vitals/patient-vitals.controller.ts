import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { PatientGuard } from '../patient/patient.guard';
import { CreateVitalReadingDto } from './dto/vitals.dto';
import { VitalsService } from './vitals.service';

@Controller('patient/vitals')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientVitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  /** GET /patient/vitals — history, KPI snapshot, alerts, and AI insights */
  @Get()
  getOverview(@CurrentUser() user: TokenPayload) {
    return this.vitalsService.getPatientVitalsOverview(user.sub);
  }

  /** POST /patient/vitals — log a home measurement */
  @Post()
  createReading(
    @CurrentUser() user: TokenPayload,
    @Body() dto: CreateVitalReadingDto,
  ) {
    return this.vitalsService.createPatientVital(user.sub, dto);
  }
}
