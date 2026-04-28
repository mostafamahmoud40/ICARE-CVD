"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { DoctorAppointment } from "./doctorAppointments.types"
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoIcon,
  Building2Icon,
} from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-[#F6EFE4] text-[#9A6B2F] border border-[#E9D9BF]",
  confirmed: "bg-[#E8F0EE] text-[#1A5345] border border-[#A8C4BC]",
  completed: "bg-[#EEF2EF] text-[#738678] border border-[#DDE5E0]",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.scheduled,
      )}
    >
      {status}
    </span>
  )
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

type AppointmentDayListProps = {
  appointments: DoctorAppointment[]
  selectedDate: Date | undefined
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

export function AppointmentDayList({
  appointments,
  selectedDate,
  onSelectAppointment,
}: AppointmentDayListProps) {
  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5EEEA] bg-white py-8 sm:py-12">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
          <CalendarDaysIcon className="size-6 text-[#9CA3AF] sm:size-7" />
        </div>
        <p className="text-[13px] text-[#6B7870]">Select a day to view appointments</p>
      </div>
    )
  }

  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy")

  return (
    <div className="flex flex-col rounded-xl border border-[#E5EEEA] bg-white">
      {/* Date header */}
      <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
        <h3 className="text-[14px] font-semibold text-[#1A1F1E]">{formattedDate}</h3>
        <p className="text-[11px] text-[#6B7870]">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Appointments */}
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F5F5F3] sm:size-14">
            <CalendarDaysIcon className="size-6 text-[#9CA3AF] sm:size-7" />
          </div>
          <p className="text-[13px] text-[#6B7870]">No appointments on this day</p>
        </div>
      ) : (
        <div className="divide-y divide-[#E8E6E0]">
          {appointments.map((appointment) => {
            const isVirtual = appointment.visitType === "virtual"
            const isCancelled = appointment.status === "cancelled"

            return (
              <div
                key={appointment.id}
                onClick={() => onSelectAppointment(appointment)}
                className={cn(
                  "group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F9F8F5]",
                  isCancelled && "opacity-50",
                )}
              >
                {/* Time */}
                <div className="w-[68px] shrink-0">
                  <span className="flex items-center gap-1 text-[13px] font-medium text-[#1A1F1E]">
                    <ClockIcon className="size-3.5 text-[#6B7870]" />
                    {formatTimeOnly(appointment.scheduledAt)}
                  </span>
                </div>

                {/* Visit type icon */}
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    isVirtual ? "bg-violet-50" : "bg-[#E8F0EE]",
                  )}
                >
                  {isVirtual ? (
                    <VideoIcon className="size-4 text-violet-500" />
                  ) : (
                    <Building2Icon className="size-4 text-[#1A5345]" />
                  )}
                </div>

                {/* Patient info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                    {appointment.patient.name}
                  </p>
                  <p className="truncate text-[11px] text-[#6B7870]">
                    {appointment.patient.age != null ? `${appointment.patient.age}y, ` : ""}
                    {appointment.patient.gender}
                    {appointment.reason ? ` — ${appointment.reason}` : ""}
                  </p>
                </div>

                {/* Status */}
                <StatusBadge status={appointment.status} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
