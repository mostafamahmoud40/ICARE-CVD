export const WEEKDAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type WeekdayId = (typeof WEEKDAY_ORDER)[number]

/** One contiguous window (e.g. a shift segment). */
export type TimeBlock = {
  id: string
  startTime: string
  endTime: string
}

export type DayAvailability = {
  weekday: WeekdayId
  label: string
  enabled: boolean
  /** One or more working windows in this day */
  periods: TimeBlock[]
  /** Breaks / admin blocks — not bookable inside the day */
  unavailableBlocks: TimeBlock[]
  /** Cap on how many appointments can be booked; null = no limit */
  maxAppointmentsPerDay: number | null
}

export type DoctorSchedulePayload = {
  days: DayAvailability[]
  /** Length of each bookable slot when generating times */
  slotDurationMinutes: number
  /** Buffer time between consecutive slots (cleanup/prep time) */
  bufferBetweenSlotsMinutes: number
}
