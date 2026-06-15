import type { AssistantAccountApiProfile } from "./assistant-account/assistantAccount.api"

const CACHE_KEY = "ICARE_CVD_ASSISTANT_HEADER_PROFILE"

const listeners = new Set<() => void>()

export function subscribeAssistantHeaderProfile(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notifyAssistantHeaderProfileListeners() {
  listeners.forEach((listener) => listener())
}

let profileSnapshotRaw: string | null | undefined
let profileSnapshot: AssistantAccountApiProfile | null = null

export function getAssistantHeaderProfileSnapshot(): AssistantAccountApiProfile | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (raw === profileSnapshotRaw) {
      return profileSnapshot
    }

    profileSnapshotRaw = raw
    if (!raw) {
      profileSnapshot = null
      return null
    }

    profileSnapshot = JSON.parse(raw) as AssistantAccountApiProfile
    return profileSnapshot
  } catch {
    profileSnapshotRaw = null
    profileSnapshot = null
    return null
  }
}

export function writeAssistantHeaderProfileCache(profile: AssistantAccountApiProfile) {
  if (typeof window === "undefined") return
  try {
    const nextRaw = JSON.stringify(profile)
    window.sessionStorage.setItem(CACHE_KEY, nextRaw)
    profileSnapshotRaw = nextRaw
    profileSnapshot = profile
    notifyAssistantHeaderProfileListeners()
  } catch {
    // ignore quota / private mode
  }
}

export function clearAssistantHeaderProfileCache() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(CACHE_KEY)
    profileSnapshotRaw = null
    profileSnapshot = null
    notifyAssistantHeaderProfileListeners()
  } catch {
    // ignore
  }
}
