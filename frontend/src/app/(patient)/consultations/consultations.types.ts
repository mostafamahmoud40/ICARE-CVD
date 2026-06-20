export type VitalMetric = {
  label: string
  value: string
  unit: string
  status: "normal" | "elevated" | "warning" | "critical"
  note?: string
}

export type Medication = {
  name: string
  dosage: string
  schedule: string
  status: "ongoing" | "increased" | "decreased" | "new" | "discontinued"
  note?: string
  icon: "blue" | "red" | "green" | "yellow"
}

export type ClinicalOrderStatus = "pending" | "scheduled" | "completed"

export type ClinicalOrderKind = "lab" | "imaging" | "referral" | "appointment" | "self_care"

export type ClinicalOrder = {
  id: string
  kind: ClinicalOrderKind
  title: string
  detail: string
  status: ClinicalOrderStatus
  dueDate?: string
  /** Set when kind is referral — another specialist visit. */
  specialty?: string
  referredDoctor?: string
  urgency?: "routine" | "urgent"
}

export type PreviousVisit = {
  date: string
  title: string
  doctor: string
  isToday?: boolean
}

export type DiagnosisTag = {
  label: string
  variant: "urgency" | "stable" | "improving" | "critical"
}

/** Patient-facing status of the clinical report (not appointment booking). */
export type ConsultationRecordStatus = "report-ready" | "pending-report" | "updated"

export type ConsultationsViewMode = "table" | "timeline"

/** How the visit was held — in person at the clinic or online. */
export type ConsultationVisitType = "clinic" | "virtual"

export type PatientVisitInstructions = {
  diagnosisSummary: string
  lifestyleAdvice: string
  dangerSigns: string
}

export type VisitSummary = {
  id: string
  scheduledAt: string
  visitType: ConsultationVisitType
  /** Legacy label; specialty is also on `doctor.specialty`. */
  visitTitle: string
  doctor: {
    name: string
    specialty: string
  }
  recordStatus: ConsultationRecordStatus
  vitals: VitalMetric[]
  doctorNotes: string
  diagnosis: {
    tags: DiagnosisTag[]
    description: string
  }
  medications: Medication[]
  orders: ClinicalOrder[]
  previousVisits: PreviousVisit[]
  patientInstructions?: PatientVisitInstructions
  reasonForVisit: string
  aiNote?: string
}

export type ConsultationsData = {
  visits: VisitSummary[]
  totalCount: number
}

export type ConsultationStats = {
  totalReports: number
  thisMonthReports: number
  pendingReports: number
  followUpDue: number
}
