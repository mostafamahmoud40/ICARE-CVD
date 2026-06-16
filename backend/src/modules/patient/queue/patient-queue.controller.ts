import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { PatientGuard } from '../patient.guard';
import { PatientQueueService } from './patient-queue.service';

@Controller('patient/queue')
@UseGuards(AccessTokenGuard, PatientGuard)
export class PatientQueueController {
  constructor(private readonly service: PatientQueueService) {}

  /** GET /patient/queue/today — returns the current patient's queue entry for today */
  @Get('today')
  async getTodayQueue(@CurrentUser() user: TokenPayload) {
    return this.service.getTodayQueue(user.sub);
  }
}
