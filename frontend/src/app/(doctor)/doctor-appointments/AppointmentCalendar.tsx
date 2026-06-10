"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import type { DoctorAppointment } from "./doctorAppointments.types"
import { AppointmentCalendarGrid } from "./AppointmentCalendarGrid"
import { AppointmentDayList } from "./AppointmentDayList"

type AppointmentCalendarProps = {
  appointments: DoctorAppointment[]
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
}: Omit<AppointmentCalendarProps, "stats"> & { stats?: unknown }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const appointmentMap = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>()
    for (const apt of appointments) {
      const dateKey = format(new Date(apt.scheduledAt), "yyyy-MM-dd")
      const existing = map.get(dateKey) ?? []
      existing.push(apt)
      map.set(dateKey, existing)
    }
    // Sort each day's appointments by scheduledAt
    for (const [key, list] of map) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      map.set(key, list)
    }
    return map
  }, [appointments])

  const appointmentDays = useMemo(() => new Set(appointmentMap.keys()), [appointmentMap])

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, "yyyy-MM-dd")
    return appointmentMap.get(dateKey) ?? []
  }, [selectedDate, appointmentMap])

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="shrink-0 lg:w-auto">
        <AppointmentCalendarGrid
          appointmentDays={appointmentDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
      <div className="min-w-0 flex-1">
        <AppointmentDayList
          appointments={selectedDayAppointments}
          selectedDate={selectedDate}
          onSelectAppointment={onSelectAppointment}
        />
      </div>
    </div>
  )
}
