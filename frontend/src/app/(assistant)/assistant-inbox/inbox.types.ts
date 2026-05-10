export type MessageType = "task" | "appointment" | "system" | "doctor" | "patient"
export type MessageStatus = "unread" | "read" | "archived"
export type MessagePriority = "low" | "normal" | "high" | "urgent"

export interface InboxMessage {
  id: string
  type: MessageType
  status: MessageStatus
  priority: MessagePriority
  sender: {
    name: string
    role: string
    avatarUrl?: string
  }
  subject: string
  preview: string
  body?: string
  createdAt: string
  readAt?: string
  archivedAt?: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, unknown>
}

export interface InboxStats {
  total: number
  unread: number
  read: number
  archived: number
}

export interface InboxFilters {
  status?: MessageStatus
  type?: MessageType
  priority?: MessagePriority
  searchQuery?: string
}

export interface InboxData {
  messages: InboxMessage[]
  stats: InboxStats
  filters: InboxFilters
}
