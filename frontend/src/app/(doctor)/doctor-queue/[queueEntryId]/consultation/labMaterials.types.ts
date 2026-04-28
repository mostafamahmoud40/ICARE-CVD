/**
 * Lab materials workspace — analysis UI models.
 * Kept separate from `consultation.types` to avoid bloating core consultation DTOs.
 */

export type LabAnalysisPhase = "idle" | "analyzing" | "complete" | "error"

export type LabResultStatus = "Normal" | "High" | "Low" | "Critical"

export type LabResultRow = {
  testName: string
  value: string
  unit: string
  referenceRange: string
  status: LabResultStatus
}

export type LabAnalysisFacility = {
  hospitalName: string
  labName: string
  doctorName: string
}

export type LabAnalysisPatientStub = {
  id: string
  dateCollected: string
  dateReported: string
}

/** Structured output shown after AI analysis. Mirrors the Medical Analyzer response shape. */
export type LabAnalysisBundle = {
  facility: LabAnalysisFacility
  patient: LabAnalysisPatientStub
  results: LabResultRow[]
  summary: string
}

// ─── Raw Medical Analyzer API shapes (snake_case from the Flask service) ──────

export type MedicalAnalyzerRawResult = {
  test_name: string
  value: string
  unit: string
  reference_range: string
  status: string
}

export type MedicalAnalyzerRawBundle = {
  facility?: {
    hospital_name?: string
    lab_name?: string
    doctor_name?: string
  }
  patient?: {
    id?: string
    date_collected?: string
    date_reported?: string
  }
  results?: MedicalAnalyzerRawResult[]
  summary?: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type LabChatRole = "user" | "assistant"

export type LabChatMessage = {
  id: string
  role: LabChatRole
  content: string
}
