export type FilterTab = "chat" | "call" | "contacts"

export type MessageContentType = "text" | "image" | "file" | "link"

export type LastMessageType = "text" | "image" | "video" | "document" | "typing" | "missed_call"

export interface ContactItem {
  id: string
  name: string
  avatarColor: string
  lastMessage: string
  lastMessageType: LastMessageType
  time: string
  unreadCount: number
  isOnline: boolean
  isFavourite: boolean
  isPinned?: boolean
  statusIcon?: "double-check" | "heart" | null
}

export interface ChatMessageItem {
  id: string
  senderName: string
  time: string
  isOutgoing: boolean
  contentType: MessageContentType
  text?: string
  images?: string[]
  fileName?: string
  fileSize?: string
}

export interface ContactDetails {
  name: string
  subtitle: string
  avatarColor: string
  company: string
  role: string
  phone: string
  email: string
  sharedMediaCount: number
  sharedPhotos: string[]
  notificationsEnabled: boolean
  isFavourite: boolean
  isMuted: boolean
}
