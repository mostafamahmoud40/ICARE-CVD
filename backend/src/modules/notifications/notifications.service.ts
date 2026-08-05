import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import webpush from 'web-push';
import type { Server } from 'socket.io';

import { DRIZZLE, type Database } from '../../database/drizzle.provider';
import { notification, pushSubscription } from '../../database/schema';
import type {
  CreateNotificationInput,
  NotificationDto,
  PushSubscriptionInput,
} from './notifications.types';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private socketServer: Server | null = null;
  private pushConfigured = false;

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject =
      process.env.VAPID_SUBJECT?.trim() ?? 'mailto:support@icare-cvd.local';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.pushConfigured = true;
      return;
    }

    this.logger.warn(
      'VAPID keys missing — Web Push disabled until VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set.',
    );
  }

  attachSocketServer(server: Server) {
    this.socketServer = server;
  }

  getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY?.trim() ?? null;
  }

  isUserConnected(userId: number) {
    if (!this.socketServer) return false;
    const room = this.socketServer.sockets.adapter.rooms.get(`user:${userId}`);
    return Boolean(room && room.size > 0);
  }

  async listForUser(userId: number): Promise<NotificationDto[]> {
    const rows = await this.db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))
      .orderBy(desc(notification.createdAt));
    return rows.map((row) => this.toDto(row));
  }

  async markRead(userId: number, notificationId: number) {
    await this.db
      .update(notification)
      .set({ read: true })
      .where(eq(notification.id, notificationId));
    return { ok: true };
  }

  async markAllRead(userId: number) {
    await this.db
      .update(notification)
      .set({ read: true })
      .where(eq(notification.userId, userId));
    return { ok: true };
  }

  async savePushSubscription(userId: number, input: PushSubscriptionInput) {
    await this.db
      .insert(pushSubscription)
      .values({
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
      })
      .onConflictDoUpdate({
        target: pushSubscription.endpoint,
        set: {
          userId,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: input.userAgent ?? null,
        },
      });

    return { ok: true };
  }

  async dispatch(input: CreateNotificationInput): Promise<NotificationDto> {
    const [row] = await this.db
      .insert(notification)
      .values({
        userId: input.userId,
        kind: input.kind,
        title: input.title ?? null,
        body: input.body,
        href: input.href ?? null,
        metadata: input.metadata ?? null,
      })
      .returning();

    const dto = this.toDto(row);

    if (this.isUserConnected(input.userId)) {
      this.socketServer
        ?.to(`user:${input.userId}`)
        .emit('notification:new', dto);
    } else {
      await this.sendWebPush(input.userId, dto);
    }

    return dto;
  }

  private async sendWebPush(userId: number, dto: NotificationDto) {
    if (!this.pushConfigured) return;

    const subs = await this.db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId));

    const payload = JSON.stringify({
      title: dto.title ?? 'ICARE-CVD',
      body: dto.body,
      href: dto.href ?? '/',
      notificationId: dto.id,
    });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (error) {
          this.logger.warn(`Web push failed for subscription ${sub.id}`);
          if (
            error instanceof Error &&
            'statusCode' in error &&
            (error as { statusCode?: number }).statusCode === 410
          ) {
            await this.db
              .delete(pushSubscription)
              .where(eq(pushSubscription.id, sub.id));
          }
        }
      }),
    );
  }

  private toDto(row: typeof notification.$inferSelect): NotificationDto {
    return {
      id: String(row.id),
      kind: row.kind,
      title: row.title ?? undefined,
      body: row.body,
      href: row.href ?? undefined,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
      metadata: row.metadata ?? null,
    };
  }
}
