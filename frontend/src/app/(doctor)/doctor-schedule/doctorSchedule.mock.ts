import { createTimeBlock } from "./doctorSchedule.utils"
import type { DoctorSchedulePayload } from "./doctorSchedule.types"

export const defaultDoctorSchedule: DoctorSchedulePayload = {
  slotDurationMinutes: 30,
  bufferBetweenSlotsMinutes: 10,
  days: [
    {
      weekday: "monday",
      label: "Monday",
      enabled: true,
      periods: [createTimeBlock("09:00", "12:00"), createTimeBlock("13:00", "17:00")],
      unavailableBlocks: [createTimeBlock("12:00", "13:00")],
      maxAppointmentsPerDay: 16,
    },
    {
      weekday: "tuesday",
      label: "Tuesday",
      enabled: true,
      periods: [createTimeBlock("09:00", "17:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    },
    {
      weekday: "wednesday",
      label: "Wednesday",
      enabled: true,
      periods: [createTimeBlock("09:00", "17:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    },
    {
      weekday: "thursday",
      label: "Thursday",
      enabled: true,
      periods: [createTimeBlock("09:00", "17:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    },
    {
      weekday: "friday",
      label: "Friday",
      enabled: true,
      periods: [createTimeBlock("09:00", "17:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: 12,
    },
    {
      weekday: "saturday",
      label: "Saturday",
      enabled: false,
      periods: [createTimeBlock("09:00", "13:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    },
    {
      weekday: "sunday",
      label: "Sunday",
      enabled: false,
      periods: [createTimeBlock("09:00", "13:00")],
      unavailableBlocks: [],
      maxAppointmentsPerDay: null,
    },
  ],
}
