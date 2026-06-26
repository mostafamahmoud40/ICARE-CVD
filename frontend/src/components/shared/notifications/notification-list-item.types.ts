import type { LucideIcon } from "lucide-react"

export type NotificationActionVariant = "primary" | "secondary" | "destructive"

export type NotificationListAction = {
  id: string
  label: string
  variant?: NotificationActionVariant
  href?: string
}

export type NotificationListSender = {
  name: string
  avatarUrl?: string | null
}

/** Role-agnostic view model for notification list rows (ISP). */
export type NotificationListItemModel = {
  id: string
  title?: string
  body: string
  createdAtLabel: string
  read: boolean
  href?: string
  useIconPresentation: boolean
  icon: LucideIcon
  accent: string
  sender?: NotificationListSender
  actions?: NotificationListAction[]
}
