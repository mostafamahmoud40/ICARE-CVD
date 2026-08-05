import type { Appointment, AppointmentBookingStatus } from "./appointments.types"

export function isAppointmentSlotPast(scheduledAt: string, now = new Date()): boolean {
  const start = new Date(scheduledAt)
  return !Number.isNaN(start.getTime()) && start < now
}

/** Stored upcoming + slot passed → treat as no-show in the status column. */
export function getAppointmentBookingDisplayStatus(
  appointment: Pick<Appointment, "scheduledAt" | "status">,
  now = new Date(),
): AppointmentBookingStatus {
  if (appointment.status === "upcoming" && isAppointmentSlotPast(appointment.scheduledAt, now)) {
    return "no-show"
  }
  return appointment.status
}

export function isAppointmentManageable(status: AppointmentBookingStatus): boolean {
  return status === "upcoming" || status === "rescheduled"
}

export function partitionAppointmentsByBooking(appointments: Appointment[]) {
  const upcoming = appointments.filter(
    (a) => a.status === "upcoming" || a.status === "rescheduled",
  )
  const past = appointments.filter(
    (a) => a.status === "completed" || a.status === "no-show",
  )
  return { upcoming, past }
}

export const APPOINTMENTS_LIST_PAGE_SIZE = 8

/** Page numbers with ellipsis for shadcn Pagination (e.g. 1 … 3 4 5 … 10). */
export function getPaginationPageItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return totalPages === 1 ? [1] : []
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: Array<number | "ellipsis"> = [1]

  if (currentPage > 3) {
    items.push("ellipsis")
  }

  const rangeStart = Math.max(2, currentPage - 1)
  const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

  for (let page = rangeStart; page <= rangeEnd; page++) {
    items.push(page)
  }

  if (currentPage < totalPages - 2) {
    items.push("ellipsis")
  }

  items.push(totalPages)
  return items
}

export function sortAppointmentsByScheduledAtDesc<T extends { scheduledAt: string }>(
  appointments: T[],
): T[] {
  return [...appointments].sort(
    (a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt),
  )
}

/** Maps provisional API values until backend returns booking statuses. */
export function normalizeAppointmentBookingStatus(
  apiStatus: string,
  scheduledAt: string,
  now = new Date(),
): AppointmentBookingStatus {
  switch (apiStatus) {
    case "upcoming":
    case "completed":
    case "cancelled":
    case "no-show":
    case "rescheduled":
      return apiStatus
    case "scheduled":
    case "confirmed":
      return isAppointmentSlotPast(scheduledAt, now) ? "no-show" : "upcoming"
    default:
      return isAppointmentSlotPast(scheduledAt, now) ? "no-show" : "upcoming"
  }
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export function formatDateOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(iso))
}

export function formatDateMedium(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

export function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

export function computeFeeTotal(fees: { amount: string }[]): number {
  return fees.reduce((sum, f) => {
    const val = parseFloat(f.amount.replace(/[^0-9.]/g, ""))
    return f.amount.startsWith("-") ? sum - val : sum + val
  }, 0)
}
