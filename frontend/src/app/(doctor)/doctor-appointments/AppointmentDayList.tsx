"use client"

import { format, isPast } from "date-fns"
import { cn } from "@/lib/utils"
import type { DoctorAppointment } from "./doctorAppointments.types"
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_STYLES,
  resolveAppointmentDisplayStatus,
} from "./appointmentDisplayStatus"
import {
  Building2Icon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ClockIcon,
  VideoIcon,
} from "lucide-react"

const STATUS_STYLES = DISPLAY_STATUS_STYLES

function StatusBadge({ appointment }: { appointment: DoctorAppointment }) {
  const displayStatus = resolveAppointmentDisplayStatus(appointment)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg px-2 py-0.5 text-[10px] font-bold",
        STATUS_STYLES[displayStatus] ?? STATUS_STYLES.scheduled,
      )}
    >
      {DISPLAY_STATUS_LABELS[displayStatus]}
    </span>
  )
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function AppointmentRow({
  appointment,
  onSelect,
}: {
  appointment: DoctorAppointment
  onSelect: () => void
}) {
  const displayStatus = resolveAppointmentDisplayStatus(appointment)
  const isVirtual = appointment.visitType === "virtual"
  const isCancelled = displayStatus === "cancelled" || displayStatus === "no-show"
  const slotPast = isPast(new Date(appointment.scheduledAt))

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9F8F5] sm:px-5",
        isCancelled && "opacity-55",
        slotPast && !isCancelled && "opacity-90",
      )}
    >
      <div className="w-[72px] shrink-0">
        <span className="flex items-center gap-1.5 text-[13px] font-bold tabular-nums text-[#1A1F1E]">
          <ClockIcon className="size-3.5 text-[#9CA3AF]" aria-hidden />
          {formatTimeOnly(appointment.scheduledAt)}
        </span>
      </div>

      {isVirtual ? (
        <VideoIcon className="size-4 shrink-0 text-violet-500" aria-hidden />
      ) : (
        <Building2Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[14px] font-bold text-[#1A1F1E]">
          {appointment.patient.name}
        </p>
        <p className="truncate text-[12px] font-medium text-muted-foreground">
          {appointment.patient.age != null ? `${appointment.patient.age}y · ` : ""}
          <span className="capitalize">{appointment.patient.gender}</span>
          {appointment.reason ? ` · ${appointment.reason}` : ""}
        </p>
      </div>

      <StatusBadge appointment={appointment} />
      <ChevronRightIcon
        className="size-4 shrink-0 text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  )
}

type AppointmentDayListProps = {
  appointments: DoctorAppointment[]
  selectedDate?: Date
  heading?: string
  groupByDay?: boolean
  emptyMessage?: string
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

export function AppointmentDayList({
  appointments,
  selectedDate,
  heading,
  groupByDay = false,
  emptyMessage = "No appointments on this day",
  onSelectAppointment,
}: AppointmentDayListProps) {
  if (!groupByDay && !selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E6E0]/70 bg-white py-12 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
        <CalendarDaysIcon className="mb-3 size-8 text-[#9CA3AF]" aria-hidden />
        <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">Select a day</p>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          Tap a date on the calendar to view bookings
        </p>
      </div>
    )
  }

  const formattedDate = selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : heading ?? ""
  const now = new Date()
  const upcoming = appointments.filter((apt) => new Date(apt.scheduledAt) >= now)
  const past = appointments.filter((apt) => new Date(apt.scheduledAt) < now)
  const showSections = !groupByDay && upcoming.length > 0 && past.length > 0

  const groupedByDay = groupByDay
    ? appointments.reduce<Map<string, DoctorAppointment[]>>((acc, apt) => {
        const key = format(new Date(apt.scheduledAt), "yyyy-MM-dd")
        const list = acc.get(key) ?? []
        list.push(apt)
        acc.set(key, list)
        return acc
      }, new Map())
    : null

  return (
    <div className="flex max-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="shrink-0 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {groupByDay ? "Period summary" : "Day details"}
        </p>
        <h3 className="mt-1 font-serif text-[18px] font-bold leading-snug tracking-tight text-[#1A1F1E] sm:text-[20px]">
          {formattedDate}
        </h3>
        <p className="mt-1 text-[13px] font-medium text-muted-foreground">
          {appointments.length} booking{appointments.length === 1 ? "" : "s"}
          {!groupByDay && past.length > 0 ? ` · ${past.length} past` : ""}
          {!groupByDay && upcoming.length > 0 ? ` · ${upcoming.length} upcoming` : ""}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#E8E6E0]/60">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarDaysIcon className="mb-3 size-8 text-[#9CA3AF]" aria-hidden />
            <p className="text-[13px] font-medium text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : groupByDay && groupedByDay ? (
          <div>
            {[...groupedByDay.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dayKey, dayAppointments]) => (
                <div key={dayKey}>
                  <p className="sticky top-0 z-10 border-b border-[#E8E6E0]/60 bg-[#FAFAF8]/95 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#1A5345] backdrop-blur-sm sm:px-5">
                    {format(new Date(`${dayKey}T12:00:00`), "EEEE, MMM d")}
                    <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground">
                      ({dayAppointments.length})
                    </span>
                  </p>
                  <div className="divide-y divide-[#E8E6E0]/50">
                    {dayAppointments.map((appointment) => (
                      <AppointmentRow
                        key={appointment.id}
                        appointment={appointment}
                        onSelect={() => onSelectAppointment(appointment)}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : showSections ? (
          <div>
            <p className="sticky top-0 z-10 border-b border-[#E8E6E0]/60 bg-[#FAFAF8]/95 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm sm:px-5">
              Upcoming
            </p>
            <div className="divide-y divide-[#E8E6E0]/50">
              {upcoming.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onSelect={() => onSelectAppointment(appointment)}
                />
              ))}
            </div>
            <p className="sticky top-0 z-10 border-y border-[#E8E6E0]/60 bg-[#FAFAF8]/95 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-sm sm:px-5">
              Past
            </p>
            <div className="divide-y divide-[#E8E6E0]/50">
              {past.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onSelect={() => onSelectAppointment(appointment)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E6E0]/50">
            {appointments.map((appointment) => (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                onSelect={() => onSelectAppointment(appointment)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
