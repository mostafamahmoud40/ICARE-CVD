import type {
  AssistantShiftStatus,
  AssistantShiftWeekday,
  AssistantWeeklyShiftDay,
} from "./doctorAssistants.shifts.types"

export const ASSISTANT_SHIFT_WEEKDAYS: AssistantShiftWeekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

export const ASSISTANT_SHIFT_WEEKDAY_LABELS: Record<AssistantShiftWeekday, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
}

export const ASSISTANT_SHIFT_WEEKDAY_BADGES: Record<AssistantShiftWeekday, string> = {
  sunday: "Su",
  monday: "Mo",
  tuesday: "Tu",
  wednesday: "We",
  thursday: "Th",
  friday: "Fr",
  saturday: "Sa",
}

export const ASSISTANT_SHIFT_STATUS_LABELS: Record<AssistantShiftStatus, string> = {
  active: "Active",
  "half-day": "Half day",
  holiday: "Day off",
}

export function defaultAssistantWeeklyShifts(): AssistantWeeklyShiftDay[] {
  return ASSISTANT_SHIFT_WEEKDAYS.map((weekday) => ({
    weekday,
    status: "holiday",
    startTime: null,
    endTime: null,
    note: null,
  }))
}

export function normalizeAssistantWeeklyShifts(
  days: AssistantWeeklyShiftDay[],
): AssistantWeeklyShiftDay[] {
  const byWeekday = new Map(days.map((day) => [day.weekday, day]))
  return ASSISTANT_SHIFT_WEEKDAYS.map((weekday) => {
    const row = byWeekday.get(weekday)
    if (!row) {
      return {
        weekday,
        status: "holiday" as const,
        startTime: null,
        endTime: null,
        note: null,
      }
    }
    return { ...row, weekday }
  })
}

export function formatShiftTimeRange(
  startTime: string | null,
  endTime: string | null,
): string | null {
  if (!startTime || !endTime) return null
  const fmt = (value: string) => {
    const [h, m] = value.split(":").map(Number)
    const date = new Date()
    date.setHours(h, m, 0, 0)
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }
  return `${fmt(startTime)} — ${fmt(endTime)}`
}

export function isAssistantShiftToday(weekday: AssistantShiftWeekday) {
  const todayIndex = new Date().getDay()
  const weekdayIndex = ASSISTANT_SHIFT_WEEKDAYS.indexOf(weekday)
  return weekdayIndex === todayIndex
}

export function shiftDetailLabel(
  status: AssistantShiftStatus,
  startTime: string | null,
  endTime: string | null,
): string {
  if (status === "holiday") return "Day off"
  const range = formatShiftTimeRange(startTime, endTime)
  return range ?? "Hours not set"
}
