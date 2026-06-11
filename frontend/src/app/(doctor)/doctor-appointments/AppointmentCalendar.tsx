"use client"

import type { DoctorAppointment } from "./doctorAppointments.types"
import { AppointmentTimelineCalendar } from "./AppointmentTimelineCalendar"

type AppointmentCalendarProps = {
  appointments: DoctorAppointment[]
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  return (
    <AppointmentTimelineCalendar
      appointments={appointments}
      onSelectAppointment={onSelectAppointment}
    />
  )
}
