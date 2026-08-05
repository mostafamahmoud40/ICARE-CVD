export type VisitOutcomeStatus = "ready" | "pending"

export type VisitPrescriptionItem = {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string | null
  instructions: string | null
}

export type VisitReportDiagnosis = {
  icdCode: string
  description: string
  type: string
}

export type QueueVisitOutcomes = {
  patientId: string
  consultationId: string | null
  doctorName: string
  doctorSpecialty: string
  prescription: {
    status: VisitOutcomeStatus
    medicationCount: number
    documentId: string | null
    items: VisitPrescriptionItem[]
  }
  report: {
    status: VisitOutcomeStatus
    chiefComplaint: string | null
    historyOfPresentIllness: string | null
    physicalExam: string | null
    plan: string | null
    followUpTimeframe: string | null
    followUpInstructions: string | null
    notes: string | null
    diagnoses: VisitReportDiagnosis[]
    completedAt: string | null
  }
}
