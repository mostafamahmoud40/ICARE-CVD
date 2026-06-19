export type BriefingPrepStatus = "idle" | "preparing" | "ready"

const prepKey = (queueEntryId: string) => `icare-briefing-prep:${queueEntryId}`
const ackKey = (queueEntryId: string) => `icare-briefing-ack:${queueEntryId}`

export const BRIEFING_PREP_CHANGED = "icare-briefing-prep-changed"

function notify(queueEntryId: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(BRIEFING_PREP_CHANGED, { detail: { queueEntryId } }),
  )
}

export function getBriefingPrepStatus(queueEntryId: string): BriefingPrepStatus {
  if (typeof window === "undefined") return "idle"
  const raw = sessionStorage.getItem(prepKey(queueEntryId))
  if (raw === "preparing" || raw === "ready") return raw
  return "idle"
}

export function setBriefingPrepStatus(queueEntryId: string, status: BriefingPrepStatus) {
  if (typeof window === "undefined") return
  if (status === "idle") {
    sessionStorage.removeItem(prepKey(queueEntryId))
  } else {
    sessionStorage.setItem(prepKey(queueEntryId), status)
  }
  notify(queueEntryId)
}

export function isBriefingAcknowledged(queueEntryId: string): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(ackKey(queueEntryId)) === "1"
}

export function acknowledgeBriefing(queueEntryId: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ackKey(queueEntryId), "1")
}

export function clearBriefingAcknowledgement(queueEntryId: string) {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(ackKey(queueEntryId))
}
