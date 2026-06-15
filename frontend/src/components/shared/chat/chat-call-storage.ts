import type { CallDirection, CallKind, CallPreviewState } from "./chat-call"

export type PersistedCallEvent = {
  id: string
  conversationId: string
  kind: CallKind
  direction: CallDirection
  sentAt: string
}

const PREVIEW_KEY = "icare-cvd.chat.callPreview"
const EVENTS_KEY = "icare-cvd.chat.callEvents"

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / private mode
  }
}

export function loadCallPreviewState(): CallPreviewState {
  return readJson<CallPreviewState>(PREVIEW_KEY, {})
}

export function saveCallPreviewState(state: CallPreviewState) {
  writeJson(PREVIEW_KEY, state)
}

export function loadCallEventsState(): Record<string, PersistedCallEvent[]> {
  return readJson<Record<string, PersistedCallEvent[]>>(EVENTS_KEY, {})
}

export function saveCallEventsState(state: Record<string, PersistedCallEvent[]>) {
  writeJson(EVENTS_KEY, state)
}
