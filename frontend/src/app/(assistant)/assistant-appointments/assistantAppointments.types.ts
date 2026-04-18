export type AssistantAppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled"

export type AssistantAppointmentVisitType = "clinic" | "virtual"

export type AssistantAppointment = {
  id: string
  patientName: string
  patientPhone: string | null
  patientEmail: string
  doctorName: string
  department: string
  scheduledAt: string
  visitType: AssistantAppointmentVisitType
  reason: string
  status: AssistantAppointmentStatus
  createdAt: string
}

export type AppointmentStats = {
  total: number
  scheduled: number
  confirmed: number
  completed: number
  cancelled: number
}

export type DoctorOption = {
  id: string
  name: string
  specialty: string | null
}

export type PatientOption = {
  id: string
  name: string
  phone: string | null
}

export type CreateAppointmentPayload = {
  patientId: string
  doctorId: string
  scheduledAt: string
  visitType: "clinic" | "virtual"
  reason: string
}
