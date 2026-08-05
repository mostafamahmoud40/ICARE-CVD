import type { ConsultationData } from "./consultation.types"

const DRAFT_PREFIX = "icare-consultation-draft:"

export const CONSULTATION_DRAFT_CHANGED = "consultation-draft-changed"

export function consultationDraftKey(queueEntryId: string): string {
  return `${DRAFT_PREFIX}${queueEntryId}`
}

export function loadConsultationDraft(queueEntryId: string): ConsultationData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(consultationDraftKey(queueEntryId))
    if (!raw) return null
    return JSON.parse(raw) as ConsultationData
  } catch {
    return null
  }
}

export function saveConsultationDraft(queueEntryId: string, data: ConsultationData): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(consultationDraftKey(queueEntryId), JSON.stringify(data))
    window.dispatchEvent(
      new CustomEvent(CONSULTATION_DRAFT_CHANGED, { detail: { queueEntryId } }),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function hasConsultationDraft(queueEntryId: string): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(consultationDraftKey(queueEntryId)) !== null
}

export function clearConsultationDraft(queueEntryId: string): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(consultationDraftKey(queueEntryId))
  window.dispatchEvent(
    new CustomEvent(CONSULTATION_DRAFT_CHANGED, { detail: { queueEntryId } }),
  )
}
