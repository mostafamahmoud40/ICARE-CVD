import type { WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"
import { WEEKDAY_ORDER } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"

const WEEKDAY_TO_JS: Record<WeekdayId, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

/** Next calendar date (YYYY-MM-DD) matching a weekday, including today if it matches. */
export function nextCalendarDateForWeekday(
  weekday: WeekdayId,
  from: Date = new Date(),
): string {
  const target = WEEKDAY_TO_JS[weekday]
  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  for (let i = 0; i < 8; i += 1) {
    if (cursor.getDay() === target) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, "0")
      const d = String(cursor.getDate()).padStart(2, "0")
      return `${y}-${m}-${d}`
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return WEEKDAY_ORDER.includes(weekday) ? nextCalendarDateForWeekday(weekday) : ""
}

export function weekdayFromDateString(date: string): WeekdayId {
  const [y, m, d] = date.split("-").map(Number)
  const js = new Date(y, m - 1, d).getDay()
  const entry = Object.entries(WEEKDAY_TO_JS).find(([, v]) => v === js)
  return (entry?.[0] as WeekdayId) ?? "monday"
}
