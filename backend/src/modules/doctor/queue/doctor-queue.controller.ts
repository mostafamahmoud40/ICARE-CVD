import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { TokenPayload } from '../../auth/jwt';
import { DoctorGuard } from '../doctor.guard';
import { DoctorQueueService } from './doctor-queue.service';
import {
  UpdateQueueEntryDto,
  UpdateQueueStatusDto,
  type QueueFilter,
} from './dto/doctor-queue.dto';
import { DRIZZLE } from '../../../database/drizzle.provider';
import type { Database } from '../../../database/drizzle.provider';
import { doctor } from '../../../database/schema';

@Controller('doctor/queue')
@UseGuards(AccessTokenGuard, DoctorGuard)
export class DoctorQueueController {
  constructor(
    private readonly service: DoctorQueueService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  private async resolveDoctorId(userId: number): Promise<string> {
    const [row] = await this.db
      .select({ id: doctor.id })
      .from(doctor)
      .where(eq(doctor.userId, userId))
      .limit(1);
    return row.id;
  }

  @Get('stats')
  async getStats(@CurrentUser() user: TokenPayload) {
    const doctorId = await this.resolveDoctorId(user.sub);
    return this.service.getStats(doctorId);
  }

  @Get()
  async listQueueEntries(
    @CurrentUser() user: TokenPayload,
    @Query('filter') filter?: QueueFilter,
  ) {
    const doctorId = await this.resolveDoctorId(user.sub);
    return this.service.listQueueEntries(doctorId, filter);
  }

  @Get(':queueId')
  async getQueueEntry(
    @CurrentUser() user: TokenPayload,
    @Param('queueId') queueId: string,
  ) {
    const doctorId = await this.resolveDoctorId(user.sub);
    return this.service.getQueueEntry(doctorId, queueId);
  }

  @Patch(':queueId/status')
  async updateStatus(
    @CurrentUser() user: TokenPayload,
    @Param('queueId') queueId: string,
    @Body() dto: UpdateQueueStatusDto,
  ) {
    const doctorId = await this.resolveDoctorId(user.sub);
    return this.service.updateStatus(doctorId, queueId, dto.status);
  }

  @Patch(':queueId')
  async updateEntry(
    @CurrentUser() user: TokenPayload,
    @Param('queueId') queueId: string,
    @Body() dto: UpdateQueueEntryDto,
  ) {
    const doctorId = await this.resolveDoctorId(user.sub);
    return this.service.updateEntry(doctorId, queueId, dto);
  }
}
