import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { TokenPayload } from '../auth/jwt';
import { CreateDocumentDto } from '../documents/dto/documents.dto';
import { AssistantGuard } from './assistant.guard';
import { AssistantPatientQueueService } from './assistant-patient-queue.service';
import {
  AddToQueueDto,
  UpdateQueueEntryDto,
  UpdateQueueStatusDto,
  type QueueFilter,
} from './dto/patient-queue.dto';

@Controller('assistant/patient-queue')
@UseGuards(AccessTokenGuard, AssistantGuard)
export class AssistantPatientQueueController {
  constructor(private readonly service: AssistantPatientQueueService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get()
  listQueueEntries(@Query('filter') filter?: QueueFilter) {
    return this.service.listQueueEntries(filter);
  }

  @Get(':queueId/documents')
  listQueuePatientDocuments(@Param('queueId') queueId: string) {
    return this.service.listQueuePatientDocuments(queueId);
  }

  @Post(':queueId/documents')
  registerQueuePatientDocument(
    @Param('queueId') queueId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.service.registerQueuePatientDocument(queueId, user.sub, {
      fileName: dto.fileName,
      contentType: dto.contentType,
      category: dto.category,
      title: dto.title,
      s3Key: dto.s3Key ?? '',
      fileSize: dto.fileSize,
    });
  }

  @Get(':queueId')
  getQueueEntry(@Param('queueId') queueId: string) {
    return this.service.getQueueEntry(queueId);
  }

  @Post()
  addToQueue(
    @Body() dto: AddToQueueDto,
    @CurrentUser() currentUser: TokenPayload,
  ) {
    return this.service.addToQueue(dto, currentUser.sub);
  }

  @Patch(':queueId/status')
  updateStatus(
    @Param('queueId') queueId: string,
    @Body() dto: UpdateQueueStatusDto,
  ) {
    return this.service.updateStatus(queueId, dto.status);
  }

  @Patch(':queueId')
  updateEntry(
    @Param('queueId') queueId: string,
    @Body() dto: UpdateQueueEntryDto,
  ) {
    return this.service.updateEntry(queueId, dto);
  }

  @Delete(':queueId')
  removeFromQueue(@Param('queueId') queueId: string) {
    return this.service.removeFromQueue(queueId);
  }
}
