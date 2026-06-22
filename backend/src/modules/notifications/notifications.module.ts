import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AccessTokenGuard } from '../auth/access-token.guard';
import { AuthJwtService } from '../auth/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { QueueNotificationService } from './queue-notification.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    QueueNotificationService,
    NotificationsGateway,
    AuthJwtService,
    AccessTokenGuard,
  ],
  exports: [NotificationsService, QueueNotificationService],
})
export class NotificationsModule {}
