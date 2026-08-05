export type ChatMessageAttachment = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  attachmentType: "image" | "file"
  url: string
}

export type ChatContact = {
  id: string
  name: string
  role: string
  avatar: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  isTyping?: boolean
  /** ISO timestamp of the latest message (for call-preview vs message ordering). */
  lastMessageAt?: string
  email?: string | null
  specialty?: string | null
  clinicLocation?: string | null
}

export type ChatMessage = {
  id: string
  contactId: string
  text: string
  time: string
  isSender: boolean
  status: "sent" | "delivered" | "read"
  attachments?: ChatMessageAttachment[]
}

export type ChatOutgoingAttachment = {
  fileName: string
  mimeType: string
  sizeBytes: number
  s3Key: string
  attachmentType: "image" | "file"
}

export type SendChatMessageInput = {
  text?: string
  attachments?: ChatOutgoingAttachment[]
}

// ─── Backend API row shapes ───────────────────────────────────────────────────

export type ConversationApiRow = {
  id: number
  participant: {
    userId: number
    name: string
    role: string
    avatarUrl: string | null
    email?: string | null
    specialty?: string | null
    clinicLocation?: string | null
  }
  unreadCount: number
  lastMessage: {
    text: string
    senderType: "doctor" | "patient" | "assistant"
    sentAt: string
    isRead: boolean
  } | null
  createdAt: string
}

export type MessageApiRow = {
  id: number
  conversationId: number
  senderId: number
  senderType: "doctor" | "patient" | "assistant"
  message: string
  isRead: boolean
  sentAt: string
  attachments?: ChatMessageAttachment[]
}

export type ChatUploadIntentResult = {
  key: string
  uploadUrl: string
  publicUrl?: string
  expiresIn: number
}
