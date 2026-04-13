export type AssistantAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled"

export type AssistantAppointmentVisitType = "clinic" | "virtual"

export type AssistantAppointment = {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  doctorName: string
  department: string
  scheduledAt: string
  visitType: AssistantAppointmentVisitType
  reason: string
  status: AssistantAppointmentStatus
}
