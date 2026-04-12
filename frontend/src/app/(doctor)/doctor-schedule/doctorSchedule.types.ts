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

export type DayAvailability = {
  weekday: WeekdayId
  label: string
  enabled: boolean
  /** Local time HH:mm */
  startTime: string
  /** Local time HH:mm */
  endTime: string
}

export type DoctorSchedulePayload = {
  days: DayAvailability[]
  /** Length of each bookable slot when generating times */
  slotDurationMinutes: number
}
