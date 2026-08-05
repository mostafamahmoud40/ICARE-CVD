import { Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { QueueNotificationService } from './queue-notification.service';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    QueueNotificationService,
    NotificationsGateway,
  ],
  exports: [NotificationsService, QueueNotificationService],
})
export class NotificationsModule {}
