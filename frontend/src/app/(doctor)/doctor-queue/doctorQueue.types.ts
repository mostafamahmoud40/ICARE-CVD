export type QueueStatus =
  | "scheduled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "completed"
  | "no-show"
  | "cancelled"

export type QueuePriority = "normal" | "urgent" | "emergency"

export type QueueVisitType = "follow-up" | "new" | "walk-in" | "urgent-care" | "post-procedure"

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
}

export type QueueStats = {
  totalToday: number
  scheduled: number
  arrived: number
  inWaiting: number
  inConsultation: number
  completed: number
  noShow: number
  avgWaitMin: number
  currentWaitMin: number
}
