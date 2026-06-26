import {
  BotMessageSquareIcon,
  CalendarDaysIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  PillIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
} from "lucide-react"

import { formatNotificationTime } from "@/lib/notifications/notification-display"
import type { PatientNotificationKind, PatientNotificationMeta } from "./patientNotifications.types"
import type { NotificationListItemModel } from "@/components/shared/notifications/notification-list-item.types"

const ICON_FIRST_KINDS = new Set<PatientNotificationKind>([
  "medication",
  "ai_insight",
  "system",
  "lab_result",
  "vitals_alert",
  "queue",
])

const META: Record<PatientNotificationKind, PatientNotificationMeta> = {
  appointment: { icon: CalendarDaysIcon, accent: "#E89042" },
  queue: { icon: ListOrderedIcon, accent: "#1A5345" },
  lab_result: { icon: FlaskConicalIcon, accent: "#7C3AED" },
  vitals_alert: { icon: HeartPulseIcon, accent: "#E8345E" },
  medication: { icon: PillIcon, accent: "#2563EB" },
  consultation: { icon: StethoscopeIcon, accent: "#1A5345" },
  prescription: { icon: PillIcon, accent: "#CC5533" },
  ai_insight: { icon: BotMessageSquareIcon, accent: "#7C3AED" },
  system: { icon: ShieldAlertIcon, accent: "#E89042" },
  message: { icon: MessageSquareIcon, accent: "#2563EB" },
  procedure: { icon: FileTextIcon, accent: "#1A5345" },
}

export function getPatientNotificationMeta(kind: PatientNotificationKind): PatientNotificationMeta {
  return META[kind]
}

export { formatNotificationTime }

export function toPatientNotificationListItem(
  notification: import("./patientNotifications.types").PatientNotification,
): NotificationListItemModel {
  const { icon, accent } = getPatientNotificationMeta(notification.kind)
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    createdAtLabel: formatNotificationTime(notification.createdAt),
    read: notification.read,
    href: notification.href,
    useIconPresentation:
      !notification.sender || ICON_FIRST_KINDS.has(notification.kind),
    icon,
    accent,
    sender: notification.sender,
    actions: notification.actions,
  }
}
