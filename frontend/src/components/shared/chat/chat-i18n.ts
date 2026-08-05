import {
  INCOMING_VIDEO_RING_LABEL,
  INCOMING_VOICE_RING_LABEL,
  MISSED_VIDEO_CALL_LABEL,
  MISSED_VOICE_CALL_LABEL,
  OUTGOING_RING_LABEL,
  OUTGOING_VIDEO_CALL_LABEL,
  OUTGOING_VOICE_CALL_LABEL,
} from "./chat-call"
import {
  CHAT_LAST_MESSAGE_DOCUMENT,
  CHAT_LAST_MESSAGE_PHOTO,
} from "./chat-message-preview"

type ChatTranslator = (key: string) => string

const CALL_LABEL_KEYS: Record<string, string> = {
  [MISSED_VIDEO_CALL_LABEL]: "call.missedVideo",
  [MISSED_VOICE_CALL_LABEL]: "call.missedVoice",
  [OUTGOING_VIDEO_CALL_LABEL]: "call.outgoingVideo",
  [OUTGOING_VOICE_CALL_LABEL]: "call.outgoingVoice",
  [INCOMING_VIDEO_RING_LABEL]: "call.incomingVideo",
  [INCOMING_VOICE_RING_LABEL]: "call.incomingVoice",
  [OUTGOING_RING_LABEL]: "call.calling",
}

export function translateChatPreviewText(text: string, t: ChatTranslator): string {
  if (text === CHAT_LAST_MESSAGE_PHOTO) return t("preview.photo")
  if (text === CHAT_LAST_MESSAGE_DOCUMENT) return t("preview.document")

  const callKey = CALL_LABEL_KEYS[text]
  if (callKey) return t(callKey)

  return text
}

export function translateChatRole(role: string, t: ChatTranslator): string {
  if (role === "doctor") return t("roles.doctor")
  if (role === "patient") return t("roles.patient")
  if (role === "assistant") return t("roles.assistant")
  return role.charAt(0).toUpperCase() + role.slice(1)
}
