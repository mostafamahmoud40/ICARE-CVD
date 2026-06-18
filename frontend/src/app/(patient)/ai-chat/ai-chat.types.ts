export type AiChatRole = "user" | "assistant"

export type AiChatActionIcon = "download" | "calendar" | "message" | "activity" | "alert"

export type AgentActionRecord = {
  tool: string
  label: string
  status: "success" | "error"
  detail?: string
}

export type PipelineStageRecord = {
  stage: number
  key: string
  label: string
  summary: string
}

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
  /** Tool steps the agent executed (book, cancel, reschedule, …) */
  agentActions?: AgentActionRecord[]
  /** Multi-stage pipeline trace from backend */
  pipelineTrace?: PipelineStageRecord[]
}

export type AiAssistantReply = {
  text: string
  greeting?: string
  actions?: AiChatAction[]
}

export type AiChatDisplayMessage = AiChatMessage & {
  time?: string
}
