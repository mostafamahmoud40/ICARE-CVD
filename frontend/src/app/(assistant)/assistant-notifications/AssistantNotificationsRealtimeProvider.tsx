"use client"

import type { ApiNotification } from "@/lib/notifications/notifications.api"
import { isAssistantNotificationLiveKind } from "@/app/(assistant)/assistant-notifications/assistantNotifications.config"
import { prependAssistantRealtimeNotification, refreshAssistantNotificationsFromApi } from "@/app/(assistant)/assistant-notifications/useAssistantNotifications"
import type { AssistantNotificationKind } from "@/app/(assistant)/assistant-notifications/assistantNotifications.types"
import { NotificationsRealtimeProvider } from "@/components/shared/notifications/NotificationsRealtimeProvider"

const ASSISTANT_KINDS: AssistantNotificationKind[] = [
  "emergency",
  "queue",
  "appointment",
  "procedure",
  "doctor_message",
  "checklist",
  "document",
  "system",
]

function mapAssistantKind(kind: string): AssistantNotificationKind {
  if (ASSISTANT_KINDS.includes(kind as AssistantNotificationKind)) {
    return kind as AssistantNotificationKind
  }
  return "system"
}

function handleAssistantNotification(notification: ApiNotification) {
  const kind = mapAssistantKind(notification.kind)
  if (!isAssistantNotificationLiveKind(kind)) return

  prependAssistantRealtimeNotification({
    id: notification.id,
    kind,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    createdAt: notification.createdAt,
    read: notification.read,
  })
}

export function AssistantNotificationsRealtimeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationsRealtimeProvider
      onNotification={handleAssistantNotification}
      onRefresh={refreshAssistantNotificationsFromApi}
    >
      {children}
    </NotificationsRealtimeProvider>
  )
}
