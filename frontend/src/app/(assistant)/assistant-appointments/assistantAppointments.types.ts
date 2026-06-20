export type AssistantAppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled"

export type AssistantAppointmentVisitType = "clinic" | "virtual"

export type AppointmentDateScopeFilter = "all" | "today" | "upcoming" | "past"

export type AssistantAppointmentAdvancedFilters = {
  visitType: "all" | AssistantAppointmentVisitType
  doctorName: string
  department: string
  dateScope: AppointmentDateScopeFilter
  dateFrom: string
  dateTo: string
}

export const defaultAssistantAppointmentAdvancedFilters: AssistantAppointmentAdvancedFilters = {
  visitType: "all",
  doctorName: "",
  department: "",
  dateScope: "all",
  dateFrom: "",
  dateTo: "",
}

export type AssistantPatientGender = "male" | "female" | "other"

export type AssistantAppointment = {
  id: string
  confirmationCode?: string
  /** Present when loaded from API list/detail */
  patientId?: string
  doctorId?: string
  patientName: string
  patientPhone: string | null
  patientEmail: string
  patientAge?: number | null
  patientGender?: AssistantPatientGender | null
  patientAvatarUrl?: string | null
  doctorName: string
  doctorAvatarUrl?: string | null
  department: string
  scheduledAt: string
  visitType: AssistantAppointmentVisitType
  reason: string
  symptoms?: string | null
  notes?: string | null
  status: AssistantAppointmentStatus
  cancelledAt?: string | null
  createdAt: string
  /** Signed-off visit narrative when backend provides it */
  visitSummary?: string | null
  /** External PDF/portal link for the full visit report */
  visitReportUrl?: string | null
  queueId?: string | null
  queueStatus?: string | null
}

export type PatchAssistantAppointmentPayload = {
  scheduledAt?: string
  doctorId?: string
  visitType?: AssistantAppointmentVisitType
  reason?: string
  notes?: string
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
  name: string | null
  specialty: string | null
  avatarUrl?: string | null
}

export type AvailableSlotOption = {
  value: string
  label: string
}

export type PatientOption = {
  id: string
  name: string | null
  phone: string | null
  avatarUrl?: string | null
}

export type CreateAppointmentPayload = {
  patientId: string
  doctorId: string
  scheduledAt: string
  visitType: "clinic" | "virtual"
  reason: string
}
