import type { ChatContact } from "./chat.types"

export type CallKind = "video" | "voice"
export type CallDirection = "outgoing" | "incoming"

export const MISSED_VIDEO_CALL_LABEL = "Missed Video Call"
export const MISSED_VOICE_CALL_LABEL = "Missed Call"
export const OUTGOING_VIDEO_CALL_LABEL = "You tried a video call"
export const OUTGOING_VOICE_CALL_LABEL = "You tried a call"
export const INCOMING_VIDEO_RING_LABEL = "Incoming video call..."
export const INCOMING_VOICE_RING_LABEL = "Incoming call..."
export const OUTGOING_RING_LABEL = "Calling..."

export type CallPreviewPhase = "ringing" | "ended"

export function missedCallLabel(kind: CallKind) {
  return kind === "video" ? MISSED_VIDEO_CALL_LABEL : MISSED_VOICE_CALL_LABEL
}

export function outgoingCallLabel(kind: CallKind) {
  return kind === "video" ? OUTGOING_VIDEO_CALL_LABEL : OUTGOING_VOICE_CALL_LABEL
}

export function ringingCallLabel(kind: CallKind, direction: CallDirection) {
  if (direction === "incoming") {
    return kind === "video" ? INCOMING_VIDEO_RING_LABEL : INCOMING_VOICE_RING_LABEL
  }
  return OUTGOING_RING_LABEL
}

export function callPreviewLabel(
  kind: CallKind,
  direction: CallDirection,
  phase: CallPreviewPhase = "ended",
) {
  if (phase === "ringing") return ringingCallLabel(kind, direction)
  return direction === "outgoing" ? outgoingCallLabel(kind) : missedCallLabel(kind)
}

export function isCallActivityLabel(text: string) {
  return (
    text === MISSED_VIDEO_CALL_LABEL ||
    text === MISSED_VOICE_CALL_LABEL ||
    text === OUTGOING_VIDEO_CALL_LABEL ||
    text === OUTGOING_VOICE_CALL_LABEL ||
    text === INCOMING_VIDEO_RING_LABEL ||
    text === INCOMING_VOICE_RING_LABEL ||
    text === OUTGOING_RING_LABEL
  )
}

export function callMetaFromLabel(
  text: string,
): { kind: CallKind; direction: CallDirection } | null {
  if (text === MISSED_VIDEO_CALL_LABEL) return { kind: "video", direction: "incoming" }
  if (text === MISSED_VOICE_CALL_LABEL) return { kind: "voice", direction: "incoming" }
  if (text === OUTGOING_VIDEO_CALL_LABEL) return { kind: "video", direction: "outgoing" }
  if (text === OUTGOING_VOICE_CALL_LABEL) return { kind: "voice", direction: "outgoing" }
  if (text === INCOMING_VIDEO_RING_LABEL) return { kind: "video", direction: "incoming" }
  if (text === INCOMING_VOICE_RING_LABEL) return { kind: "voice", direction: "incoming" }
  if (text === OUTGOING_RING_LABEL) return { kind: "video", direction: "outgoing" }
  return null
}

/** @deprecated Use callMetaFromLabel */
export function callKindFromLabel(text: string): CallKind | null {
  return callMetaFromLabel(text)?.kind ?? null
}

export type CallPreviewEntry = {
  kind: CallKind
  time: string
  direction: CallDirection
  phase: CallPreviewPhase
  /** ISO timestamp — used to avoid overriding newer chat messages in the sidebar. */
  sentAt?: string
}

export type CallPreviewState = Record<string, CallPreviewEntry>

export function applyCallPreview(contact: ChatContact, preview?: CallPreviewState): ChatContact {
  const entry = preview?.[contact.id]
  if (!entry) return contact

  if (contact.lastMessageAt) {
    if (!entry.sentAt) return contact
    const messageMs = new Date(contact.lastMessageAt).getTime()
    const callMs = new Date(entry.sentAt).getTime()
    if (messageMs > callMs) return contact
  }

  const phase = entry.phase ?? "ended"
  return {
    ...contact,
    lastMessage: callPreviewLabel(entry.kind, entry.direction, phase),
    time: entry.time,
    lastMessageAt: entry.sentAt ?? contact.lastMessageAt,
  }
}
