import { WEEKDAY_ORDER } from "./doctorSchedule.types"
import type { DayAvailability, DoctorSchedulePayload, TimeBlock } from "./doctorSchedule.types"

export function generateTimeBlockId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `tb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function createTimeBlock(
  startTime: string,
  endTime: string,
  id?: string,
): TimeBlock {
  return {
    id: id ?? generateTimeBlockId(),
    startTime,
    endTime,
  }
}

export function createEmptySchedule(): DoctorSchedulePayload {
  return {
    slotDurationMinutes: 30,
    bufferBetweenSlotsMinutes: 10,
    days: WEEKDAY_ORDER.map((weekday) => ({
      weekday,
      label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      enabled: false,
      periods: [],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    })),
    blockedDates: [],
  }
}

type LegacyDay = {
  weekday: string
  label: string
  enabled: boolean
  startTime: string
  endTime: string
}

function isLegacyDay(day: unknown): day is LegacyDay {
  if (!day || typeof day !== "object") return false
  const d = day as Record<string, unknown>
  return (
    typeof d.startTime === "string" &&
    typeof d.endTime === "string" &&
    !Array.isArray(d.periods)
  )
}

export function migrateLegacyDoctorSchedule(
  data: unknown
): DoctorSchedulePayload | null {
  if (!data || typeof data !== "object") return null
  const root = data as Record<string, unknown>
  if (!Array.isArray(root.days) || root.days.length !== 7) return null

  const first = root.days[0]
  if (!isLegacyDay(first)) return null

  const days: DayAvailability[] = root.days.map((dayRaw, index) => {
    const day = dayRaw as LegacyDay
    const weekday = WEEKDAY_ORDER[index]!
    return {
      weekday,
      label: typeof day.label === "string" ? day.label : weekday,
      enabled: Boolean(day.enabled),
      periods: [
        createTimeBlock(
          typeof day.startTime === "string" ? day.startTime : "09:00",
          typeof day.endTime === "string" ? day.endTime : "17:00"
        ),
      ],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    }
  })

  const slot =
    typeof root.slotDurationMinutes === "number" &&
    Number.isFinite(root.slotDurationMinutes)
      ? root.slotDurationMinutes
      : 30

  const buffer =
    typeof root.bufferBetweenSlotsMinutes === "number" &&
    Number.isFinite(root.bufferBetweenSlotsMinutes)
      ? root.bufferBetweenSlotsMinutes
      : 10

  const blockedDates = Array.isArray(root.blockedDates) ? root.blockedDates : []

  return {
    slotDurationMinutes: slot,
    bufferBetweenSlotsMinutes: buffer,
    days,
    blockedDates,
  }
}
