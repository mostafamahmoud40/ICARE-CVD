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

export type FollowUpInstruction = {
  title: string
  description: string
  status: "pending" | "completed" | "scheduled"
  date?: string
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

export type VisitSummary = {
  id: string
  date: string
  doctor: {
    name: string
    specialty: string
  }
  status: "completed" | "scheduled" | "cancelled" | "in-progress"
  vitals: VitalMetric[]
  doctorNotes: string
  diagnosis: {
    tags: DiagnosisTag[]
    description: string
  }
  medications: Medication[]
  followUpInstructions: FollowUpInstruction[]
  previousVisits: PreviousVisit[]
  aiNote?: string
}

export type ConsultationsData = {
  visits: VisitSummary[]
  totalCount: number
}

export type ConsultationStats = {
  totalVisits: number
  completedVisits: number
  upcomingVisits: number
  thisMonthVisits: number
}
