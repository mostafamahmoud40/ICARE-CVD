export type CreateNotificationInput = {
  userId: number;
  kind: string;
  title?: string | null;
  body: string;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationDto = {
  id: string;
  kind: string;
  title?: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};
