"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import type { DoctorAppointment, AppointmentStats } from "./doctorAppointments.types"
import { AppointmentCalendarGrid } from "./AppointmentCalendarGrid"
import { AppointmentDayList } from "./AppointmentDayList"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  StethoscopeIcon,
  XCircleIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className={cn("flex size-9 items-center justify-center rounded-lg", accent)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-[#102F27]">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

type AppointmentCalendarProps = {
  appointments: DoctorAppointment[]
  stats: AppointmentStats
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

export function AppointmentCalendar({
  appointments,
  stats,
  onSelectAppointment,
}: AppointmentCalendarProps) {
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
    <div className="w-full overflow-hidden bg-white">
      {/* Header with stats */}
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#1A5345]">
            <StethoscopeIcon className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#1A1F1E]">My Appointments</h2>
            <p className="text-[11px] text-[#6B7870]">
              {stats.today} today &middot; {stats.upcoming} upcoming &middot; {stats.cancelled} cancelled
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={<CalendarDaysIcon className="size-4 text-[#1A5345]" />}
            label="Today"
            value={stats.today}
            accent="bg-[#E8F0EE]"
          />
          <StatCard
            icon={<ClockIcon className="size-4 text-[#C26D2A]" />}
            label="Upcoming"
            value={stats.upcoming}
            accent="bg-[#F9F2E8]"
          />
          <StatCard
            icon={<CheckCircle2Icon className="size-4 text-[#2E8B68]" />}
            label="Completed"
            value={stats.completed}
            accent="bg-[#F4F9F7]"
          />
          <StatCard
            icon={<XCircleIcon className="size-4 text-red-500" />}
            label="Cancelled"
            value={stats.cancelled}
            accent="bg-red-50"
          />
        </div>
      </div>

      {/* Calendar + Day list layout */}
      <div className="flex flex-col gap-4 p-4 lg:flex-row">
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
    </div>
  )
}
