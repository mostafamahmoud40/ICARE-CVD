export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"

export type VisitType = "clinic" | "virtual"

export type PatientInfo = {
  id: string
  fullName: string
  age: number
  gender: "male" | "female"
  condition?: string
}

export type DoctorAppointment = {
  id: string
  confirmationCode: string
  scheduledAt: string
  patient: PatientInfo
  department: string
  reason: string
  symptoms?: string
  notes?: string
  visitType: VisitType
  status: AppointmentStatus
  cancelledAt?: string
  createdAt: string
}

export type FilterTab = "all" | "today" | "upcoming" | "completed" | "cancelled"

export type AppointmentStats = {
  todayCount: number
  upcomingCount: number
  completedTodayCount: number
  cancelledCount: number
}

export type DoctorAppointmentsPageData = {
  appointments: DoctorAppointment[]
  stats: AppointmentStats
}
