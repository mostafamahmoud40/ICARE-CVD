"use client"

import { toast } from "sonner"

import { NotificationListItem } from "@/components/shared/notifications/NotificationListItem"
import type { NotificationListAction } from "@/components/shared/notifications/notification-list-item.types"

import type {
  DoctorNotification,
  DoctorNotificationAction,
} from "./doctorNotifications.types"
import { toDoctorNotificationListItem } from "./doctorNotifications.utils"

type DoctorNotificationListItemProps = {
  notification: DoctorNotification
  compact?: boolean
  onSelect?: () => void
  onAction?: (notificationId: string, action: DoctorNotificationAction) => void
}

export function DoctorNotificationListItem({
  notification,
  compact = false,
  onSelect,
  onAction,
}: DoctorNotificationListItemProps) {
  return (
    <NotificationListItem
      item={toDoctorNotificationListItem(notification)}
      compact={compact}
      onSelect={onSelect}
      onAction={onAction as (id: string, action: NotificationListAction) => void}
    />
  )
}

export function handleDoctorNotificationAction(
  notificationId: string,
  action: DoctorNotificationAction,
  resolveAction: (notificationId: string, actionId: string) => void,
) {
  resolveAction(notificationId, action.id)
  toast.success("Action recorded")
}
