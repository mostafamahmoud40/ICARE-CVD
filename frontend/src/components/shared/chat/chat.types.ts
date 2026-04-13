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
