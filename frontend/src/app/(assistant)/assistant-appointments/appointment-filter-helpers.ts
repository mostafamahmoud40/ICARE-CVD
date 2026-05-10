import type {
  AssistantAppointment,
  AssistantAppointmentAdvancedFilters,
  AppointmentDateScopeFilter,
} from "./assistantAppointments.types"

function startOfLocalDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function appointmentLocalDayMs(iso: string): number {
  return startOfLocalDayMs(new Date(iso))
}

export function matchesAppointmentDateScope(
  appointment: AssistantAppointment,
  scope: AppointmentDateScopeFilter,
): boolean {
  if (scope === "all") return true
  const todayStart = startOfLocalDayMs(new Date())
  const day = appointmentLocalDayMs(appointment.scheduledAt)
  if (scope === "today") return day === todayStart
  if (scope === "upcoming") return day > todayStart
  if (scope === "past") return day < todayStart
  return true
}

export function appointmentMatchesAdvancedFilters(
  appointment: AssistantAppointment,
  filters: AssistantAppointmentAdvancedFilters,
): boolean {
  if (filters.visitType !== "all" && appointment.visitType !== filters.visitType) {
    return false
  }
  if (filters.doctorName.trim()) {
    if (
      appointment.doctorName.trim().toLowerCase() !== filters.doctorName.trim().toLowerCase()
    ) {
      return false
    }
  }
  if (filters.department.trim()) {
    if (
      appointment.department.trim().toLowerCase() !== filters.department.trim().toLowerCase()
    ) {
      return false
    }
  }
  if (!matchesAppointmentDateScope(appointment, filters.dateScope)) {
    return false
  }
  return true
}
