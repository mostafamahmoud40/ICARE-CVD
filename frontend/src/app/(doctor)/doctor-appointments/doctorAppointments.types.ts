export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"

export type QueueStatus =
  | "scheduled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "report-pending"
  | "completed"
  | "no-show"
  | "cancelled"

export type VisitType = "clinic" | "virtual"

export type PatientInfo = {
  id: string
  name: string
  avatar: string | null
  age: number | null
  gender: "male" | "female" | "other"
}

export type DoctorAppointment = {
  id: string
  confirmationCode: string
  scheduledAt: string
  patient: PatientInfo
  department: string
  reason: string
  symptoms?: string | null
  notes?: string | null
  visitType: VisitType
  status: AppointmentStatus
  queueId: string | null
  queueStatus: QueueStatus | null
  cancelledAt: string | null
  createdAt: string
}

export type FilterTab = "all" | "today" | "upcoming" | "completed" | "cancelled"

export type AppointmentStats = {
  today: number
  upcoming: number
  completed: number
  cancelled: number
}
