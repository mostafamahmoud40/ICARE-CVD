import type { LucideIcon } from "lucide-react"

export type PatientNotificationKind =
  | "appointment"
  | "queue"
  | "lab_result"
  | "vitals_alert"
  | "medication"
  | "consultation"
  | "prescription"
  | "ai_insight"
  | "system"
  | "message"
  | "procedure"

export type PatientNotificationSender = {
  name: string
  avatarUrl?: string | null
  role?: "doctor" | "assistant" | "clinic"
}

export type PatientNotificationActionVariant = "primary" | "secondary" | "destructive"

export type PatientNotificationAction = {
  id: string
  label: string
  variant?: PatientNotificationActionVariant
  href?: string
}

export type PatientNotification = {
  id: string
  kind: PatientNotificationKind
  title?: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  sender?: PatientNotificationSender
  actions?: PatientNotificationAction[]
}

export type PatientNotificationMeta = {
  icon: LucideIcon
  accent: string
}
