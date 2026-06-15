"use client"

import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DoctorAppointment } from "./doctorAppointments.types"
import { AppointmentDayList } from "./AppointmentDayList"

type AppointmentCalendarProps = {
  appointments: DoctorAppointment[]
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

function toDateKey(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd")
}

function isDayInRange(day: Date, rangeFrom: string, rangeTo: string) {
  const key = format(day, "yyyy-MM-dd")
  if (rangeFrom && key < rangeFrom) return false
  if (rangeTo && key > rangeTo) return false
  return true
}

function formatTimeShort(iso: string) {
  return format(new Date(iso), "h:mm a")
}

export function AppointmentCalendar({
  appointments,
  onSelectAppointment,
}: AppointmentCalendarProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [rangeFrom, setRangeFrom] = useState("")
  const [rangeTo, setRangeTo] = useState("")

  const hasRange = Boolean(rangeFrom || rangeTo)

  const filteredAppointments = useMemo(() => {
    if (!hasRange) return appointments
    return appointments.filter((apt) => {
      const key = toDateKey(apt.scheduledAt)
      if (rangeFrom && key < rangeFrom) return false
      if (rangeTo && key > rangeTo) return false
      return true
    })
  }, [appointments, hasRange, rangeFrom, rangeTo])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthAnchor)
    const monthEnd = endOfMonth(monthAnchor)
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    })
  }, [monthAnchor])

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>()
    for (const apt of filteredAppointments) {
      const key = toDateKey(apt.scheduledAt)
      const list = map.get(key) ?? []
      list.push(apt)
      map.set(key, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    }
    return map
  }, [filteredAppointments])

  const monthAppointments = useMemo(() => {
    return filteredAppointments.filter((apt) => isSameMonth(new Date(apt.scheduledAt), monthAnchor))
  }, [filteredAppointments, monthAnchor])

  const selectedDayAppointments = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd")
    return appointmentsByDay.get(key) ?? []
  }, [selectedDate, appointmentsByDay])

  const periodListAppointments = useMemo(() => {
    return [...filteredAppointments].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
  }, [filteredAppointments])

  const periodHeading = useMemo(() => {
    if (!hasRange) return undefined
    const fromLabel = rangeFrom ? format(parseISO(rangeFrom), "MMM d, yyyy") : "Start"
    const toLabel = rangeTo ? format(parseISO(rangeTo), "MMM d, yyyy") : "End"
    return `${fromLabel} – ${toLabel}`
  }, [hasRange, rangeFrom, rangeTo])

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day)
    if (!isSameMonth(day, monthAnchor)) {
      setMonthAnchor(startOfMonth(day))
    }
  }

  const handleRangeFromChange = (value: string) => {
    setRangeFrom(value)
    if (value) {
      setMonthAnchor(startOfMonth(parseISO(value)))
      if (rangeTo && value > rangeTo) setRangeTo(value)
    }
  }

  const handleRangeToChange = (value: string) => {
    setRangeTo(value)
    if (value && rangeFrom && value < rangeFrom) setRangeFrom(value)
  }

  const clearRange = () => {
    setRangeFrom("")
    setRangeTo("")
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] animate-in zoom-in-95 duration-500">
        <div className="flex flex-col gap-4 border-b border-[#E8E6E0]/60 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <h2 className="font-serif text-[20px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[22px]">
                Schedule calendar
              </h2>
              <p className="text-[13px] font-medium text-muted-foreground">
                {monthAppointments.length} booking{monthAppointments.length === 1 ? "" : "s"} in{" "}
                {format(monthAnchor, "MMMM yyyy")}
              </p>
            </div>

            <div className="flex h-8 shrink-0 items-center gap-1 self-start rounded-lg border border-[#E8E6E0] bg-white p-0.5 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]"
                onClick={() => setMonthAnchor((m) => subMonths(m, 1))}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="size-3.5" />
              </Button>
              <span className="min-w-[112px] px-1 text-center text-[12px] font-bold text-[#1A1F1E]">
                {format(monthAnchor, "MMMM yyyy")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]"
                onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarRangeIcon className="size-4 text-[#1A5345]" aria-hidden />
                <p className="text-[12px] font-bold text-[#1A1F1E]">Filter by period</p>
              </div>
              {hasRange ? (
                <button
                  type="button"
                  onClick={clearRange}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A5345] transition-colors hover:text-[#133F34]"
                >
                  <XIcon className="size-3" aria-hidden />
                  Clear
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="calendar-range-from" className="text-[12px] font-bold text-[#1A1F1E]">
                  From
                </Label>
                <Input
                  id="calendar-range-from"
                  type="date"
                  value={rangeFrom}
                  onChange={(e) => handleRangeFromChange(e.target.value)}
                  className="h-9 rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] focus-visible:border-[#1A5345]/40 focus-visible:ring-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="calendar-range-to" className="text-[12px] font-bold text-[#1A1F1E]">
                  To
                </Label>
                <Input
                  id="calendar-range-to"
                  type="date"
                  value={rangeTo}
                  onChange={(e) => handleRangeToChange(e.target.value)}
                  className="h-9 rounded-lg border-[#cfd9d5] bg-white text-[13px] text-[#152a24] focus-visible:border-[#1A5345]/40 focus-visible:ring-0"
                />
              </div>
            </div>
            {hasRange ? (
              <p className="mt-2.5 text-[12px] font-medium text-[#6B7870]">
                Showing {filteredAppointments.length} booking
                {filteredAppointments.length === 1 ? "" : "s"} in selected period
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r border-[#E8E6E0]/40 px-2 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground last:border-r-0 sm:px-4 sm:text-[12px]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const inMonth = isSameMonth(day, monthAnchor)
            const today = isToday(day)
            const selected = isSameDay(day, selectedDate)
            const inRange = !hasRange || isDayInRange(day, rangeFrom, rangeTo)
            const dateKey = format(day, "yyyy-MM-dd")
            const dayAppointments = inRange ? (appointmentsByDay.get(dateKey) ?? []) : []
            const count = dayAppointments.length

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelectDay(day)}
                disabled={hasRange && !inRange}
                className={cn(
                  "group flex min-h-[108px] flex-col border-b border-r border-[#E8E6E0]/40 p-2 text-left transition-colors sm:min-h-[120px] sm:p-2.5",
                  idx % 7 === 6 && "border-r-0",
                  !inMonth && "bg-[#F9F8F5]/30 opacity-40",
                  inMonth && inRange && "hover:bg-[#1A5345]/[0.02]",
                  hasRange && !inRange && "cursor-not-allowed opacity-25",
                  selected && inRange && "bg-[#E8F0EE]/60 ring-1 ring-inset ring-[#1A5345]/25",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-[13px] font-bold tabular-nums",
                      today && inRange && "bg-[#1A5345] text-white shadow-sm",
                      !today && "text-[#102F27]",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {count > 0 ? (
                    <span className="rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <span
                      key={apt.id}
                      className={cn(
                        "truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold leading-tight sm:text-[10px]",
                        apt.status === "cancelled"
                          ? "bg-red-50 text-red-600 line-through"
                          : apt.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#E8F0EE] text-[#1A5345]",
                      )}
                    >
                      {formatTimeShort(apt.scheduledAt)} · {apt.patient.name.split(" ")[0]}
                    </span>
                  ))}
                  {count > 2 ? (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      +{count - 2} more
                    </span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <AppointmentDayList
        appointments={hasRange ? periodListAppointments : selectedDayAppointments}
        selectedDate={hasRange ? undefined : selectedDate}
        heading={hasRange ? periodHeading : undefined}
        groupByDay={hasRange}
        emptyMessage={
          hasRange ? "No appointments in this period" : "No appointments on this day"
        }
        onSelectAppointment={onSelectAppointment}
      />
    </div>
  )
}
