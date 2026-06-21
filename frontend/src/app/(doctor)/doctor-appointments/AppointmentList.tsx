"use client"

import type { DoctorAppointment } from "./doctorAppointments.types"
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_STYLES,
  resolveAppointmentDisplayStatus,
} from "./appointmentDisplayStatus"
import { cn } from "@/lib/utils"
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoIcon,
  Building2Icon,
  ChevronRightIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientAvatar } from "@/components/shared/PatientAvatar"

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

const STATUS_STYLES = DISPLAY_STATUS_STYLES

function StatusBadge({ appointment }: { appointment: DoctorAppointment }) {
  const displayStatus = resolveAppointmentDisplayStatus(appointment)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold",
        STATUS_STYLES[displayStatus] ?? STATUS_STYLES.scheduled,
      )}
    >
      {DISPLAY_STATUS_LABELS[displayStatus]}
    </span>
  )
}

type AppointmentListProps = {
  appointments: DoctorAppointment[]
  isLoading: boolean
  onSelectAppointment: (appointment: DoctorAppointment) => void
  className?: string
}

export function AppointmentList({
  appointments,
  isLoading,
  onSelectAppointment,
  className,
}: AppointmentListProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse bg-white text-left">
            <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
              <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                <th className="py-4 pr-4 pl-6 w-[260px]">Patient Name</th>
                <th className="py-4 px-4 w-[220px]">Visit Reason</th>
                <th className="py-4 px-4 w-[140px]">Visit Type</th>
                <th className="py-4 px-4 w-[180px]">Date & Time</th>
                <th className="py-4 px-4 w-[120px]">Status</th>
                <th className="py-4 pl-4 pr-6 text-right w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E6E0]/40">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#E8E6E0]/40">
                    <td className="py-4 pr-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-[120px] rounded" />
                          <Skeleton className="h-3 w-[60px] rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-[150px] rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[100px] rounded" />
                        <Skeleton className="h-3 w-[60px] rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-5 w-[70px] rounded-full" />
                    </td>
                    <td className="py-4 pl-4 pr-6">
                      <Skeleton className="size-8 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <CalendarDaysIcon className="size-12 mb-4" strokeWidth={1.5} />
                      <p className="text-[15px] font-bold text-[#102F27]">No appointments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => {
                  const date = new Date(appointment.scheduledAt)
                  const displayStatus = resolveAppointmentDisplayStatus(appointment)
                  const isVirtual = appointment.visitType === "virtual"
                  const isCancelled = displayStatus === "cancelled" || displayStatus === "no-show"
                  const isPast =
                    date < new Date() &&
                    displayStatus !== "cancelled" &&
                    displayStatus !== "completed" &&
                    displayStatus !== "no-show"

                  return (
                    <tr
                      key={appointment.id}
                      onClick={() => onSelectAppointment(appointment)}
                      className={cn(
                        "group cursor-pointer border-t border-[#E8E6E0]/40 transition-all hover:bg-[#F9F8F5]/50",
                        isPast && "opacity-75",
                        isCancelled && "opacity-60",
                      )}
                    >
                      <td className="py-3.5 pr-4 pl-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
                            <PatientAvatar
                              name={appointment.patient.name}
                              avatarUrl={appointment.patient.avatar}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
                              {appointment.patient.name}
                            </p>
                            <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
                              #{appointment.confirmationCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-[#1A1F1E]/80">
                            {appointment.reason || "General Triage"}
                          </p>
                          {appointment.symptoms && (
                            <p className="truncate mt-0.5 text-[12px] text-[#6B7870]">
                              Symptoms: {appointment.symptoms}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium border",
                            isVirtual
                              ? "bg-violet-50/50 text-violet-600 border-violet-200"
                              : "bg-white text-[#1A5345] border-[#A8C4BC]/60",
                          )}
                        >
                          {isVirtual ? (
                            <VideoIcon className="size-3" />
                          ) : (
                            <Building2Icon className="size-3" />
                          )}
                          {isVirtual ? "Virtual" : "In-Clinic"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div>
                          <p className="text-[14px] font-semibold text-[#1A1F1E]">
                            {formatDateShort(appointment.scheduledAt)}
                          </p>
                          <p className="flex items-center gap-1 mt-0.5 text-[12px] text-[#6B7870] font-medium">
                            <ClockIcon className="size-3" />
                            {formatTimeOnly(appointment.scheduledAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <StatusBadge appointment={appointment} />
                      </td>
                      <td className="py-3.5 pl-4 pr-6 text-right align-middle">
                        <div className="flex justify-end">
                          <div className="flex size-7 items-center justify-center rounded-lg border border-[#E8E6E0] bg-white opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:border-[#1A5345] hover:text-[#1A5345]">
                            <ChevronRightIcon className="size-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
