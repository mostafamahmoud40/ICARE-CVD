export type ChatContact = {
  id: string
  name: string
  role: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

export type ChatMessage = {
  id: string
  contactId: string
  text: string
  time: string
  isSender: boolean
  status: "sent" | "delivered" | "read"
}

// ─── Backend API row shapes ───────────────────────────────────────────────────

export type ConversationApiRow = {
  id: number
  participant: {
    userId: number
    name: string
    role: string
  }
  unreadCount: number
  lastMessage: {
    text: string
    senderType: "doctor" | "patient"
    sentAt: string
    isRead: boolean
  } | null
  createdAt: string
}

export type MessageApiRow = {
  id: number
  conversationId: number
  senderId: number
  senderType: "doctor" | "patient"
  message: string
  isRead: boolean
  sentAt: string
}
