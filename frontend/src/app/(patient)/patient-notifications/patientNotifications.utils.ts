import {
  BotMessageSquareIcon,
  CalendarDaysIcon,
  FileTextIcon,
  FlaskConicalIcon,
  HeartPulseIcon,
  ListOrderedIcon,
  PillIcon,
  ShieldAlertIcon,
  StethoscopeIcon,
} from "lucide-react"

import { formatNotificationTime } from "@/lib/notifications/notification-display"
import type { PatientNotificationKind, PatientNotificationMeta } from "./patientNotifications.types"

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
}

export function getPatientNotificationMeta(kind: PatientNotificationKind): PatientNotificationMeta {
  return META[kind]
}

export { formatNotificationTime }
