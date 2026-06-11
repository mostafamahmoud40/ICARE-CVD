import type {
  DoctorSchedulePayload,
  WeekdayId,
} from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"

/** Upcoming patient bookings shown on the assistant schedule screen. */
export type ScheduleBooking = {
  id: string
  weekday: WeekdayId
  scheduledDate: string
  startTime: string
  endTime: string
  patientLabel: string
  avatarUrl?: string
  status?: string
}

/** One-off extra working window for a specific calendar date (weekly schedule unchanged). */
export type ScheduleDayExtra = {
  id: string
  date: string
  startTime: string
  endTime: string
  reason?: string | null
  createdAt?: string
}

export type AssistantDoctorScheduleBundle = {
  schedule: DoctorSchedulePayload
  pausedPeriodIds: string[]
  bookings: ScheduleBooking[]
  doctorArrivalByWeekday: Partial<Record<WeekdayId, string | null>>
  dayExtras: ScheduleDayExtra[]
}

export type AssistantScheduleDoctor = {
  id: string
  name: string
  specialty: string | null
}
