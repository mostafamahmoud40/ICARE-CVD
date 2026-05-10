export type QueuePatientDocumentDto = {
  id: string
  createdAt: string
  fileName: string | null
  contentType: string | null
  category: string | null
  title: string | null
  sizeBytes: number | null
}

export type StudyKind = "xray" | "ct" | "mri" | "ultrasound" | "lab_report" | "other"

/** Maps assistant-friendly study types to storage categories + readable titles */
export function studyKindToPayload(kind: StudyKind, fileName: string): {
  intentCategory: string
  registerCategory: string
  title: string
} {
  switch (kind) {
    case "xray":
      return {
        intentCategory: "imaging",
        registerCategory: "imaging",
        title: `X-ray — ${fileName}`,
      }
    case "ct":
      return {
        intentCategory: "imaging",
        registerCategory: "imaging",
        title: `CT scan — ${fileName}`,
      }
    case "mri":
      return {
        intentCategory: "imaging",
        registerCategory: "imaging",
        title: `MRI — ${fileName}`,
      }
    case "ultrasound":
      return {
        intentCategory: "imaging",
        registerCategory: "imaging",
        title: `Ultrasound — ${fileName}`,
      }
    case "lab_report":
      return {
        intentCategory: "lab_report",
        registerCategory: "lab_report",
        title: `Lab report — ${fileName}`,
      }
    default:
      return {
        intentCategory: "other",
        registerCategory: "other",
        title: fileName,
      }
  }
}

export const STUDY_KIND_OPTIONS: { value: StudyKind; label: string }[] = [
  { value: "xray", label: "X-ray / plain film" },
  { value: "ct", label: "CT scan" },
  { value: "mri", label: "MRI" },
  { value: "ultrasound", label: "Ultrasound" },
  { value: "lab_report", label: "Lab report" },
  { value: "other", label: "Other document" },
]

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  lab_report: "Lab report",
  imaging: "Imaging",
  ecg: "ECG",
  prescription: "Prescription",
  referral: "Referral",
  other: "Other",
}
