import { timeToMinutes } from "@/app/(doctor)/doctor-schedule/doctorSchedule.schema"
import type { DayAvailability, TimeBlock, WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"

import type { ScheduleBooking } from "./assistantDoctorSchedule.types"

export type ComputedAvailableSlot = {
  key: string
  startTime: string
  endTime: string
}

function minutesToHm(total: number): string {
  const m = Math.max(0, Math.round(total))
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function rangeOverlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 < b1 && b0 < a1
}

function blockMinutes(b: Pick<TimeBlock, "startTime" | "endTime">): [number, number] {
  return [timeToMinutes(b.startTime), timeToMinutes(b.endTime)]
}

/**
 * Bookable slot starts inside active (non-paused) working periods, stepped by
 * slot length + buffer. Excludes breaks (`unavailableBlocks`) and other bookings.
 *
 * If `doctorArrivalTime` is set and is later than a period's start, slot generation
 * begins from the first aligned step boundary >= the arrival minute, effectively
 * pushing the earliest available slot to when the doctor actually arrives.
 */
export function computeAvailableSlotsForDay(params: {
  day: DayAvailability
  slotDurationMinutes: number
  bufferBetweenSlotsMinutes: number
  pausedPeriodIds: string[]
  bookings: ScheduleBooking[]
  weekday: WeekdayId
  /** When set, only bookings on this calendar date block slots (for rescheduling a specific appointment). */
  scheduledDate?: string
  /** When moving a booking, ignore its current window so the same slot can reappear as "free". */
  excludeBookingId: string | null
  /**
   * Actual arrival time of the doctor (HH:mm). When provided, free slots before
   * this time are suppressed - the first bookable slot aligns to or after arrival.
   */
  doctorArrivalTime?: string | null
  /** Date-specific extra periods (not part of the weekly template). */
  extraPeriods?: Array<Pick<TimeBlock, "startTime" | "endTime">>
}): ComputedAvailableSlot[] {
  const {
    day,
    slotDurationMinutes,
    bufferBetweenSlotsMinutes,
    pausedPeriodIds,
    bookings,
    weekday,
    scheduledDate,
    excludeBookingId,
    extraPeriods = [],
  } = params

  const mergedPeriods = [...day.periods, ...extraPeriods]
  const effectiveDay =
    extraPeriods.length > 0 ? { ...day, periods: mergedPeriods, enabled: true } : day

  if (!effectiveDay.enabled || slotDurationMinutes <= 0) return []

  const step = Math.max(slotDurationMinutes, slotDurationMinutes + bufferBetweenSlotsMinutes)
  const paused = new Set(pausedPeriodIds)

  const otherBookings = bookings.filter((b) => {
    if (b.id === excludeBookingId) return false
    if (b.weekday !== weekday) return false
    if (scheduledDate && b.scheduledDate !== scheduledDate) return false
    return true
  })

  const out: ComputedAvailableSlot[] = []

  const arrivalMin =
    params.doctorArrivalTime ? timeToMinutes(params.doctorArrivalTime) : null

  for (const period of effectiveDay.periods) {
    if (paused.has(period.id)) continue

    const [p0, p1] = blockMinutes(period)

    // If the doctor arrives after this period starts, push the first slot
    // forward to the first step boundary >= arrival time.
    let startMin = p0
    if (arrivalMin !== null && arrivalMin > p0) {
      if (arrivalMin >= p1) continue // arrival after period ends — skip entire period
      // Align to the first step boundary >= arrivalMin
      const stepsNeeded = Math.ceil((arrivalMin - p0) / step)
      startMin = p0 + stepsNeeded * step
    }

    for (let t = startMin; t + slotDurationMinutes <= p1; t += step) {
      const s = t
      const e = t + slotDurationMinutes

      let blocked = false
      for (const u of effectiveDay.unavailableBlocks) {
        const [u0, u1] = blockMinutes(u)
        if (rangeOverlaps(s, e, u0, u1)) {
          blocked = true
          break
        }
      }
      if (blocked) continue

      for (const bk of otherBookings) {
        const [b0, b1] = blockMinutes(bk)
        if (rangeOverlaps(s, e, b0, b1)) {
          blocked = true
          break
        }
      }
      if (blocked) continue

      const startTime = minutesToHm(s)
      const endTime = minutesToHm(e)
      out.push({ key: `${startTime}-${endTime}`, startTime, endTime })
    }
  }

  return out
}
