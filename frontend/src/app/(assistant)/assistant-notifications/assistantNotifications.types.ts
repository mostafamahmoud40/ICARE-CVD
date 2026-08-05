import type { LucideIcon } from "lucide-react"

export type AssistantNotificationKind =
  | "emergency"
  | "queue"
  | "appointment"
  | "procedure"
  | "doctor_message"
  | "checklist"
  | "document"
  | "system"

export type AssistantNotificationSender = {
  name: string
  avatarUrl?: string | null
  role?: "patient" | "doctor" | "assistant"
}

export type AssistantNotificationActionVariant = "primary" | "secondary" | "destructive"

export type AssistantNotificationAction = {
  id: string
  label: string
  variant?: AssistantNotificationActionVariant
  href?: string
}

export type AssistantNotification = {
  id: string
  kind: AssistantNotificationKind
  title?: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  sender?: AssistantNotificationSender
  actions?: AssistantNotificationAction[]
}

export type AssistantNotificationMeta = {
  icon: LucideIcon
  accent: string
}
