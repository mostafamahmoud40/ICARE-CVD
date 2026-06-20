export type QueueStatus =
  | "scheduled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "report-pending"
  | "completed"
  | "no-show"
  | "cancelled"

export type QueuePriority = "normal" | "urgent" | "emergency"

export type QueueVisitType = "follow-up" | "new" | "walk-in" | "urgent-care" | "post-procedure"

/** AI review flags on a past / completed visit (optional until API provides them). */
export type VisitAiInsights = {
  reviewed: boolean
  /** Short note surfaced to the assistant (e.g. follow-up or risk flag). */
  note?: string | null
}

export type QueuePatient = {
  id: string
  queueEntryId: string
  fullName: string
  age: number
  gender: "male" | "female" | "other"
  condition: string
  visitType: QueueVisitType
  priority: QueuePriority
  status: QueueStatus
  scheduledTime: string
  arrivedAt: string | null
  waitingSince: string | null
  startedAt: string | null
  completedAt: string | null
  estimatedDurationMin: number
  roomNumber: string | null
  notes: string
  hasAllergies: boolean
  activeMedications: number
  vitalAlerts: number
  phoneNumber: string
  assignedDoctor: string
  assignedDoctorDepartment: string
  aiInsights?: VisitAiInsights | null
  avatarUrl?: string
}

export type QueueStats = {
  totalToday: number
  scheduled: number
  arrived: number
  inWaiting: number
  inConsultation: number
  reportPending: number
  completed: number
  noShow: number
  avgWaitMin: number
}

export type QueueFilter = "active" | "scheduled" | "completed" | "no-show"
