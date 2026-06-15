import {
  ArchiveIcon,
  CalendarDaysIcon,
  FlagIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  PillIcon,
  ShieldAlertIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"

import type { DoctorNotificationKind, DoctorNotificationMeta } from "./doctorNotifications.types"

const META: Record<DoctorNotificationKind, DoctorNotificationMeta> = {
  queue: { icon: UsersIcon, accent: "#1A5345" },
  lab_result: { icon: FlaskConicalIcon, accent: "#7C3AED" },
  archive_request: { icon: ArchiveIcon, accent: "#CC5533" },
  appointment: { icon: CalendarDaysIcon, accent: "#E89042" },
  vitals_alert: { icon: HeartPulseIcon, accent: "#E8345E" },
  prescription: { icon: PillIcon, accent: "#2563EB" },
  ai_insight: { icon: SparklesIcon, accent: "#7C3AED" },
  system: { icon: ShieldAlertIcon, accent: "#E89042" },
  medication_flag: { icon: FlagIcon, accent: "#E11D48" },
}

export function getDoctorNotificationMeta(kind: DoctorNotificationKind): DoctorNotificationMeta {
  return META[kind]
}

export function formatNotificationTime(iso: string) {
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
