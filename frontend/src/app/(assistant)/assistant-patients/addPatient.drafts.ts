import type { StudyKind } from "../assistant-queue/assistantQueue.documents.types"
import type { AddPatientFormValues } from "./addPatient.types"

const STORAGE_KEY = "icare-assistant-add-patient-drafts"
const MAX_DRAFTS = 25

export type AddPatientDraftSnapshot = {
  values: AddPatientFormValues
  documentStudyKind: StudyKind
}

export type AddPatientDraft = {
  id: string
  label: string
  savedAt: string
  snapshot: AddPatientDraftSnapshot
}

function readDrafts(): AddPatientDraft[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AddPatientDraft[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeDrafts(drafts: AddPatientDraft[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    // ignore quota / private mode
  }
}

export function listAddPatientDrafts(): AddPatientDraft[] {
  return readDrafts().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  )
}

export function isAddPatientDraftEmpty(values: AddPatientFormValues): boolean {
  const stringFields = Object.entries(values).filter(
    ([key]) => key !== "medications" && key !== "allergies",
  ) as [keyof AddPatientFormValues, string][]

  const hasStrings = stringFields.some(([, value]) =>
    typeof value === "string" ? value.trim().length > 0 : false,
  )
  const hasLists = values.medications.length > 0 || values.allergies.length > 0
  return !hasStrings && !hasLists
}

export function buildAddPatientDraftLabel(values: AddPatientFormValues): string {
  const name = values.fullName.trim()
  if (name) return name
  const email = values.email.trim()
  if (email) return email
  return "Untitled draft"
}

export function saveAddPatientDraft(
  snapshot: AddPatientDraftSnapshot,
  draftId?: string | null,
): AddPatientDraft {
  const drafts = readDrafts()
  const now = new Date().toISOString()
  const label = buildAddPatientDraftLabel(snapshot.values)

  if (draftId) {
    const index = drafts.findIndex((draft) => draft.id === draftId)
    if (index >= 0) {
      const updated: AddPatientDraft = {
        ...drafts[index],
        label,
        savedAt: now,
        snapshot,
      }
      drafts[index] = updated
      writeDrafts(drafts)
      return updated
    }
  }

  const created: AddPatientDraft = {
    id: crypto.randomUUID(),
    label,
    savedAt: now,
    snapshot,
  }

  const next = [created, ...drafts].slice(0, MAX_DRAFTS)
  writeDrafts(next)
  return created
}

export function deleteAddPatientDraft(draftId: string): void {
  writeDrafts(readDrafts().filter((draft) => draft.id !== draftId))
}

export function getAddPatientDraft(draftId: string): AddPatientDraft | null {
  return readDrafts().find((draft) => draft.id === draftId) ?? null
}
