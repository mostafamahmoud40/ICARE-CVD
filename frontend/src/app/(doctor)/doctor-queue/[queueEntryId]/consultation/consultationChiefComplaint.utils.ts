import type { ChiefComplaintStructured } from "./consultation.types"

export function emptyChiefComplaintStructured(): ChiefComplaintStructured {
  return {
    primaryComplaint: "",
    onset: "",
    duration: "",
    severity: "",
    character: "",
    aggravating: [],
    relieving: [],
    associatedSymptoms: [],
    otherComplaintDetail: "",
  }
}

export function parseChiefComplaintStructured(
  raw: string | null | undefined,
  legacyPrimary?: string | null,
): ChiefComplaintStructured {
  const empty = emptyChiefComplaintStructured()
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw) as Partial<ChiefComplaintStructured>
      return {
        ...empty,
        ...parsed,
        aggravating: Array.isArray(parsed.aggravating) ? parsed.aggravating : empty.aggravating,
        relieving: Array.isArray(parsed.relieving) ? parsed.relieving : empty.relieving,
        associatedSymptoms: Array.isArray(parsed.associatedSymptoms)
          ? parsed.associatedSymptoms
          : empty.associatedSymptoms,
      }
    } catch {
      return empty
    }
  }
  if (legacyPrimary?.trim()) {
    return { ...empty, primaryComplaint: legacyPrimary }
  }
  return empty
}
