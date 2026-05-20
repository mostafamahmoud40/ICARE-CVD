import type { DoctorSchedulePayload, WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"
import { createEmptySchedule, createTimeBlock } from "@/app/(doctor)/doctor-schedule/doctorSchedule.utils"

import { getDefaultDemoBookings, type DemoBooking } from "./assistantDoctorSchedule.types"

export type AssistantDoctorScheduleBundle = {
  schedule: DoctorSchedulePayload
  /** Working `period.id` values the assistant has paused (no bookings until resumed). */
  pausedPeriodIds: string[]
  /** Demo patient bookings for reschedule UX (not persisted to real API). */
  demoBookings: DemoBooking[]
  /**
   * Per-weekday doctor arrival override (HH:mm). When set, free slots before this
   * time are suppressed so new bookings only appear from arrival onward.
   * Existing bookings (already placed) are NOT moved — only available slot
   * computation is affected.
   */
  doctorArrivalByWeekday: Partial<Record<WeekdayId, string | null>>
}

const memory = new Map<string, AssistantDoctorScheduleBundle>()

function buildDemoSchedule(): DoctorSchedulePayload {
  const base = createEmptySchedule()
  const workDays = new Set(["monday", "tuesday", "wednesday", "thursday", "friday"])

  const days = base.days.map((day) => {
    if (!workDays.has(day.weekday)) {
      return { ...day, enabled: false, periods: [], unavailableBlocks: [] }
    }
    const am = createTimeBlock("09:00", "12:00", `period-${day.weekday}-am`)
    const pm = createTimeBlock("14:00", "17:00", `period-${day.weekday}-pm`)
    const lunch = createTimeBlock("12:00", "13:00", `block-${day.weekday}-lunch`)
    return {
      ...day,
      enabled: true,
      periods: [am, pm],
      unavailableBlocks: [lunch],
      maxAppointmentsPerDay: day.weekday === "friday" ? 12 : 16,
    }
  })

  return {
    ...base,
    slotDurationMinutes: 30,
    bufferBetweenSlotsMinutes: 10,
    days,
    blockedDates: [{ id: "bd-demo-1", date: "2026-06-01", reason: "Conference (demo)" }],
  }
}

function cloneBundle(bundle: AssistantDoctorScheduleBundle): AssistantDoctorScheduleBundle {
  return structuredClone(bundle)
}

export function getAssistantDoctorScheduleBundle(doctorId: string): AssistantDoctorScheduleBundle {
  if (!memory.has(doctorId)) {
    memory.set(doctorId, {
      schedule: buildDemoSchedule(),
      pausedPeriodIds: [],
      demoBookings: getDefaultDemoBookings(),
      doctorArrivalByWeekday: {},
    })
  }
  const raw = memory.get(doctorId)!
  const normalized: AssistantDoctorScheduleBundle = {
    ...raw,
    demoBookings: raw.demoBookings ?? getDefaultDemoBookings(),
    doctorArrivalByWeekday: raw.doctorArrivalByWeekday ?? {},
  }
  if (raw.demoBookings == null || raw.doctorArrivalByWeekday == null) {
    memory.set(doctorId, normalized)
  }
  return cloneBundle(normalized)
}

export function setAssistantDoctorScheduleBundle(
  doctorId: string,
  bundle: AssistantDoctorScheduleBundle,
): void {
  memory.set(doctorId, cloneBundle(bundle))
}

/** For tests / dev reset only */
export function clearAssistantDoctorScheduleStore(): void {
  memory.clear()
}
