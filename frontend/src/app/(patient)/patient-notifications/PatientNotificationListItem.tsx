"use client"

import { toast } from "sonner"

import { NotificationListItem } from "@/components/shared/notifications/NotificationListItem"
import type { NotificationListAction } from "@/components/shared/notifications/notification-list-item.types"

import type {
  PatientNotification,
  PatientNotificationAction,
} from "./patientNotifications.types"
import { toPatientNotificationListItem } from "./patientNotifications.utils"

type PatientNotificationListItemProps = {
  notification: PatientNotification
  compact?: boolean
  onSelect?: () => void
  onMarkRead?: (id: string) => void
  onAction?: (notificationId: string, action: PatientNotificationAction) => void
}

export function PatientNotificationListItem({
  notification,
  compact = false,
  onSelect,
  onMarkRead,
  onAction,
}: PatientNotificationListItemProps) {
  const handleSelect = () => {
    if (!notification.read) onMarkRead?.(notification.id)
    onSelect?.()
  }

  return (
    <NotificationListItem
      item={toPatientNotificationListItem(notification)}
      compact={compact}
      onSelect={handleSelect}
      onAction={onAction as (id: string, action: NotificationListAction) => void}
    />
  )
}

export function handlePatientNotificationAction(
  notificationId: string,
  action: PatientNotificationAction,
  resolveAction: (notificationId: string, actionId: string) => void,
) {
  resolveAction(notificationId, action.id)
  toast.success("Action recorded")
}
