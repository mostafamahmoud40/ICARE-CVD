export type DoctorChatRole = "user" | "assistant"

export type DoctorChatMessage = {
  id: string
  role: DoctorChatRole
  text: string
  sentAt: Date
}

export type DoctorChatDisplayMessage = DoctorChatMessage & {
  time?: string
}

export type DoctorChatHistoryItem = {
  role: "user" | "assistant"
  content: string
}

export type DoctorAiChatApiResponse = {
  reply: string
}
