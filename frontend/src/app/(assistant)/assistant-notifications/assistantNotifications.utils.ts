import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  FileTextIcon,
  MessageCircleIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react"

import type { AssistantNotificationKind, AssistantNotificationMeta } from "./assistantNotifications.types"

const META: Record<AssistantNotificationKind, AssistantNotificationMeta> = {
  emergency: { icon: AlertTriangleIcon, accent: "#E11D48" },
  queue: { icon: UsersIcon, accent: "#1A5345" },
  appointment: { icon: CalendarClockIcon, accent: "#E89042" },
  procedure: { icon: StethoscopeIcon, accent: "#2563EB" },
  doctor_message: { icon: MessageCircleIcon, accent: "#7C3AED" },
  checklist: { icon: ClipboardListIcon, accent: "#059669" },
  document: { icon: FileTextIcon, accent: "#7C3AED" },
  system: { icon: ShieldAlertIcon, accent: "#E89042" },
}

export function getAssistantNotificationMeta(kind: AssistantNotificationKind): AssistantNotificationMeta {
  return META[kind]
}

export function formatAssistantNotificationTime(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)
}
