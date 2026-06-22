import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MinioModule } from '../../shared/storage/minio.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { ChatAttachmentService } from './chat-attachment.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
    MinioModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ChatAttachmentService,
    AuthJwtService,
    AccessTokenGuard,
  ],
})
export class ChatModule {}
