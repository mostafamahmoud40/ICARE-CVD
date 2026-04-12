import type { DoctorSchedulePayload } from "./doctorSchedule.types"

export const defaultDoctorSchedule: DoctorSchedulePayload = {
  slotDurationMinutes: 30,
  days: [
    {
      weekday: "monday",
      label: "Monday",
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      weekday: "tuesday",
      label: "Tuesday",
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      weekday: "wednesday",
      label: "Wednesday",
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      weekday: "thursday",
      label: "Thursday",
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      weekday: "friday",
      label: "Friday",
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    {
      weekday: "saturday",
      label: "Saturday",
      enabled: false,
      startTime: "09:00",
      endTime: "13:00",
    },
    {
      weekday: "sunday",
      label: "Sunday",
      enabled: false,
      startTime: "09:00",
      endTime: "13:00",
    },
  ],
}
