import type { LucideIcon } from "lucide-react"

export type DoctorNotificationKind =
  | "queue"
  | "lab_result"
  | "archive_request"
  | "appointment"
  | "vitals_alert"
  | "prescription"
  | "ai_insight"
  | "system"
  | "medication_flag"

export type DoctorNotificationSender = {
  name: string
  avatarUrl?: string | null
  role?: "patient" | "assistant"
}

export type DoctorNotificationActionVariant = "primary" | "secondary" | "destructive"

export type DoctorNotificationAction = {
  id: string
  label: string
  variant?: DoctorNotificationActionVariant
  href?: string
}

export type DoctorNotification = {
  id: string
  kind: DoctorNotificationKind
  /** Short headline for system-style alerts without a person sender. */
  title?: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  sender?: DoctorNotificationSender
  /** When set, the notification expects an explicit doctor action. */
  actions?: DoctorNotificationAction[]
}

export type DoctorNotificationMeta = {
  icon: LucideIcon
  accent: string
}
