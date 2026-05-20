import type { WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"

/** In-memory demo patient bookings for the assistant schedule screen (until API exists). */
export type DemoBooking = {
  id: string
  weekday: WeekdayId
  startTime: string
  endTime: string
  patientLabel: string
  avatarUrl?: string
}

export function getDefaultDemoBookings(): DemoBooking[] {
  return [
    {
      id: "demo-bk-1",
      weekday: "monday",
      startTime: "10:00",
      endTime: "10:30",
      patientLabel: "Layla Hassan",
      avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=Layla+Hassan`,
    },
    {
      id: "demo-bk-2",
      weekday: "wednesday",
      startTime: "15:00",
      endTime: "15:30",
      patientLabel: "Omar Ali",
      avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=Omar+Ali`,
    },
    {
      id: "demo-bk-3",
      weekday: "friday",
      startTime: "09:00",
      endTime: "09:30",
      patientLabel: "Noor Kamal",
      avatarUrl: `https://api.dicebear.com/7.x/lorelei/svg?seed=Noor+Kamal`,
    },
  ]
}
