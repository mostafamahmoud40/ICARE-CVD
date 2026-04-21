"use client"

import { useState } from "react"
import type { DoctorAppointment } from "./doctorAppointments.types"
import { AppointmentList } from "./AppointmentList"
import { AppointmentDetail } from "./AppointmentDetail"
import { AppointmentCalendar } from "./AppointmentCalendar"
import { useDoctorAppointments } from "./useDoctorAppointments"
import { CalendarIcon, LayoutListIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "list" | "calendar"

export function DoctorAppointments() {
  const { appointments, stats, updateStatus, updateNotes } = useDoctorAppointments()
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Find the latest version of the selected appointment (status may have changed)
  const currentSelected = selectedAppointment
    ? appointments.find((a) => a.id === selectedAppointment.id) ?? null
    : null

  return (
    <main className="flex flex-1 flex-col space-y-6 overflow-x-hidden bg-[#F9F8F5] px-4 py-6 md:px-6">
      {/* View toggle */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => setViewMode("list")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            viewMode === "list"
              ? "bg-[#1A5345] text-white"
              : "bg-white text-[#6B7870] hover:bg-[#E8E6E0]/50",
          )}
        >
          <LayoutListIcon className="size-4" />
          <span className="hidden sm:inline">List</span>
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
            viewMode === "calendar"
              ? "bg-[#1A5345] text-white"
              : "bg-white text-[#6B7870] hover:bg-[#E8E6E0]/50",
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="hidden sm:inline">Calendar</span>
        </button>
      </div>

      {viewMode === "list" ? (
        <AppointmentList
          appointments={appointments}
          stats={stats}
          onSelectAppointment={setSelectedAppointment}
        />
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          stats={stats}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      <AppointmentDetail
        appointment={currentSelected}
        onClose={() => setSelectedAppointment(null)}
        onUpdateStatus={(params) => updateStatus(params)}
        onUpdateNotes={(params) => updateNotes(params)}
      />
    </main>
  )
}
