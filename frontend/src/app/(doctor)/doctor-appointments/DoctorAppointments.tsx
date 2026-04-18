"use client"

import { useState } from "react"
import type { DoctorAppointment } from "./doctorAppointments.types"
import { AppointmentList } from "./AppointmentList"
import { AppointmentDetail } from "./AppointmentDetail"
import { useDoctorAppointments } from "./useDoctorAppointments"

export function DoctorAppointments() {
  const { appointments, stats, updateStatus, updateNotes } = useDoctorAppointments()
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)

  // Find the latest version of the selected appointment (status may have changed)
  const currentSelected = selectedAppointment
    ? appointments.find((a) => a.id === selectedAppointment.id) ?? null
    : null

  return (
    <main className="flex flex-1 flex-col space-y-6 overflow-x-hidden bg-[#F9F8F5] px-4 py-6 md:px-6">
      <AppointmentList
        appointments={appointments}
        stats={stats}
        onSelectAppointment={setSelectedAppointment}
      />

      <AppointmentDetail
        appointment={currentSelected}
        onClose={() => setSelectedAppointment(null)}
        onUpdateStatus={(params) => updateStatus(params)}
        onUpdateNotes={(params) => updateNotes(params)}
      />
    </main>
  )
}
