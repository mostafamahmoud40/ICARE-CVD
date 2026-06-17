import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { TokenPayload } from '../auth/jwt';
import {
  CreateTestNotificationDto,
  SavePushSubscriptionDto,
} from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AccessTokenGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: TokenPayload) {
    return this.notificationsService.listForUser(user.sub);
  }

  @Get('vapid-public-key')
  vapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: TokenPayload) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: TokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markRead(user.sub, id);
  }

  @Post('push-subscriptions')
  savePushSubscription(
    @CurrentUser() user: TokenPayload,
    @Body() body: SavePushSubscriptionDto,
  ) {
    return this.notificationsService.savePushSubscription(user.sub, {
      endpoint: body.endpoint,
      keys: body.keys,
      userAgent: body.userAgent,
    });
  }

  /** Dev/demo: trigger the same pipeline as a clinic event. */
  @Post('test')
  createTest(
    @CurrentUser() user: TokenPayload,
    @Body() body: CreateTestNotificationDto,
  ) {
    return this.notificationsService.dispatch({
      userId: user.sub,
      kind: body.kind ?? 'system',
      title: body.title ?? 'Clinic update',
      body: body.body,
      href: body.href ?? '/doctor-dashboard',
    });
  }
}
