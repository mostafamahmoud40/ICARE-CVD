export type AiChatRole = "user" | "assistant"

export type AiChatActionIcon = "download" | "calendar" | "message" | "activity" | "alert"

export type AiChatAction = {
  id: string
  label: string
  icon: AiChatActionIcon
  href?: string
}

export type AiChatMessage = {
  id: string
  role: AiChatRole
  text: string
  sentAt: Date
  /** Bold green greeting line — only on rich assistant messages */
  greeting?: string
  /** Action links below a divider — only when clinically / contextually useful */
  actions?: AiChatAction[]
}

export type AiAssistantReply = {
  text: string
  greeting?: string
  actions?: AiChatAction[]
}

export type AiChatDisplayMessage = AiChatMessage & {
  time?: string
}
