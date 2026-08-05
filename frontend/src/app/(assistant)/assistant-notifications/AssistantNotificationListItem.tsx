"use client"

import { toast } from "sonner"

import { NotificationListItem } from "@/components/shared/notifications/NotificationListItem"
import type { NotificationListAction } from "@/components/shared/notifications/notification-list-item.types"

import type {
  AssistantNotification,
  AssistantNotificationAction,
} from "./assistantNotifications.types"
import { toAssistantNotificationListItem } from "./assistantNotifications.utils"

type AssistantNotificationListItemProps = {
  notification: AssistantNotification
  compact?: boolean
  onSelect?: () => void
  onAction?: (notificationId: string, action: AssistantNotificationAction) => void
}

export function AssistantNotificationListItem({
  notification,
  compact = false,
  onSelect,
  onAction,
}: AssistantNotificationListItemProps) {
  return (
    <NotificationListItem
      item={toAssistantNotificationListItem(notification)}
      compact={compact}
      onSelect={onSelect}
      onAction={onAction as (id: string, action: NotificationListAction) => void}
    />
  )
}

export function handleAssistantNotificationAction(
  notificationId: string,
  action: AssistantNotificationAction,
  resolveAction: (notificationId: string, actionId: string) => void,
) {
  resolveAction(notificationId, action.id)
  toast.success("Action recorded")
}
