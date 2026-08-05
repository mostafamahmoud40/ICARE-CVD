import { Module } from '@nestjs/common';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [MinioModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatAttachmentService],
})
export class ChatModule {}
