import type { AppointmentStatus } from "./doctorAppointments.types"

export type QueueStatus =
  | "scheduled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "report-pending"
  | "completed"
  | "no-show"
  | "cancelled"

/** UI-only statuses (no separate "confirmed" — bookings are scheduled until clinic flow updates them). */
export type AppointmentDisplayStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "arrived"
  | "waiting"
  | "in-consultation"
  | "report-pending"
  | "no-show"
  | "overdue"

export const DISPLAY_STATUS_LABELS: Record<AppointmentDisplayStatus, string> = {
  scheduled: "Scheduled",
  arrived: "Arrived",
  waiting: "Waiting",
  "in-consultation": "In consultation",
  "report-pending": "Report pending",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No show",
  overdue: "Overdue",
}

export const DISPLAY_STATUS_STYLES: Record<AppointmentDisplayStatus, string> = {
  scheduled: "border-0 bg-amber-500 text-white hover:bg-amber-500",
  arrived: "border-0 bg-sky-500 text-white hover:bg-sky-500",
  waiting: "border-0 bg-orange-500 text-white hover:bg-orange-500",
  "in-consultation": "border-0 bg-violet-500 text-white hover:bg-violet-500",
  "report-pending": "border-0 bg-indigo-500 text-white hover:bg-indigo-500",
  completed: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
  cancelled: "border-0 bg-rose-500 text-white hover:bg-rose-500",
  "no-show": "border-0 bg-red-600 text-white hover:bg-red-600",
  overdue: "border-0 bg-slate-600 text-white hover:bg-slate-600",
}

function isPastSlot(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() < Date.now()
}

/** Legacy DB rows may still be `confirmed`; treat them as scheduled in the UI. */
export function normalizeAppointmentStatus(status: AppointmentStatus | string): AppointmentStatus {
  return status === "confirmed" ? "scheduled" : (status as AppointmentStatus)
}

export function resolveAppointmentDisplayStatus(appointment: {
  status: AppointmentStatus | string
  scheduledAt: string
  queueStatus?: QueueStatus | string | null
}): AppointmentDisplayStatus {
  const status = normalizeAppointmentStatus(appointment.status)

  if (status === "cancelled") return "cancelled"
  if (status === "completed") return "completed"

  const queue = appointment.queueStatus as QueueStatus | null | undefined
  if (queue === "no-show") return "no-show"
  if (queue === "cancelled") return "cancelled"
  if (queue === "completed") return "completed"
  if (queue === "report-pending") return "report-pending"
  if (queue === "in-consultation") return "in-consultation"
  if (queue === "waiting") return "waiting"
  if (queue === "arrived") return "arrived"

  if (isPastSlot(appointment.scheduledAt)) return "no-show"
  return "scheduled"
}

export function isTerminalDisplayStatus(status: AppointmentDisplayStatus): boolean {
  return status === "completed" || status === "cancelled" || status === "no-show"
}

export function isActiveClinicVisit(status: AppointmentDisplayStatus): boolean {
  return (
    status === "arrived" ||
    status === "waiting" ||
    status === "in-consultation" ||
    status === "report-pending"
  )
}
