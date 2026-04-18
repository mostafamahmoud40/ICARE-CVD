export type DiagnosisType = "primary" | "secondary" | "differential"

export type DiagnosisSeverity = "mild" | "moderate" | "severe" | "critical"

export type DiagnosisStatus = "active" | "chronic" | "resolved"

export type DiagnosisConfirmation = "confirmed" | "unconfirmed" | "presumed"

export type NyhaClass = "I" | "II" | "III" | "IV" | ""

export type Laterality = "unspecified" | "left" | "right" | "bilateral" | "other"

export type DiagnosisFormValues = {
  icdCode: string
  description: string
  type: DiagnosisType
  confirmation: DiagnosisConfirmation
  onsetDate: string
  severity: DiagnosisSeverity
  status: DiagnosisStatus
  nyhaClass: NyhaClass
  laterality: Laterality
  clinicalNotes: string
}

