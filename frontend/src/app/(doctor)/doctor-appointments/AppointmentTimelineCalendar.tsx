"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns"
import {
  Building2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  PlusIcon,
  VideoIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DoctorAppointment, VisitType } from "./doctorAppointments.types"

const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const

const ROW_PALETTES = [
  { row: "bg-[#FAF3EA]", card: "bg-[#F5E6D3] border-[#E8D5BC]", accent: "text-[#8B6914]" },
  { row: "bg-[#FDF2F8]", card: "bg-[#FCE7F3] border-[#F5CFE6]", accent: "text-[#9D174D]" },
  { row: "bg-[#EFF6FF]", card: "bg-[#DBEAFE] border-[#BFDBFE]", accent: "text-[#1D4ED8]" },
  { row: "bg-[#F5F3FF]", card: "bg-[#EDE9FE] border-[#DDD6FE]", accent: "text-[#6D28D9]" },
] as const

const DAY_COL_WIDTH = 108

type VisitFilter = "all" | VisitType

type AppointmentTimelineCalendarProps = {
  appointments: DoctorAppointment[]
  onSelectAppointment: (appointment: DoctorAppointment) => void
}

function formatSlotLabel(hour: number) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return format(date, "h:mm a")
}

function formatTimeShort(iso: string) {
  return format(new Date(iso), "h:mm a")
}

function slotKey(date: Date, hour: number) {
  return `${format(date, "yyyy-MM-dd")}-${hour}`
}

export function AppointmentTimelineCalendar({
  appointments,
  onSelectAppointment,
}: AppointmentTimelineCalendarProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()))
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all")

  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(monthAnchor),
        end: endOfMonth(monthAnchor),
      }),
    [monthAnchor],
  )

  const departments = useMemo(() => {
    const set = new Set(appointments.map((a) => a.department).filter(Boolean))
    return Array.from(set).sort()
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (departmentFilter !== "all" && apt.department !== departmentFilter) return false
      if (visitFilter !== "all" && apt.visitType !== visitFilter) return false
      return true
    })
  }, [appointments, departmentFilter, visitFilter])

  const slotMap = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>()
    for (const apt of filteredAppointments) {
      if (apt.status === "cancelled") continue
      const date = new Date(apt.scheduledAt)
      const key = slotKey(date, date.getHours())
      const list = map.get(key) ?? []
      list.push(apt)
      map.set(key, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    }
    return map
  }, [filteredAppointments])

  const clinicCount = filteredAppointments.filter(
    (a) => a.visitType === "clinic" && a.status !== "cancelled",
  ).length
  const virtualCount = filteredAppointments.filter(
    (a) => a.visitType === "virtual" && a.status !== "cancelled",
  ).length

  const monthLabel = format(monthAnchor, "MMMM yyyy")

  const handleEmptySlotClick = (day: Date, hour: number) => {
    toast.message("Add appointment", {
      description: `Preview — book ${format(day, "MMM d")} at ${formatSlotLabel(hour)}.`,
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-3 border-b border-[#E8E6E0]/60 bg-[#FAFAF8] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="h-9 w-[min(100%,200px)] rounded-xl border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] shadow-sm">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#E8E6E0]">
              <SelectItem value="all" className="text-[12px] font-medium">
                All departments
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept} className="text-[12px] font-medium">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm">
            {(
              [
                { id: "all" as const, label: "All", count: filteredAppointments.length },
                { id: "clinic" as const, label: "In clinic", count: clinicCount, icon: Building2Icon },
                { id: "virtual" as const, label: "Virtual", count: virtualCount, icon: VideoIcon },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setVisitFilter(pill.id)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-bold transition-all",
                  visitFilter === pill.id
                    ? "bg-[#1A1F1E] text-white shadow-sm"
                    : "text-muted-foreground hover:text-[#1A1F1E]",
                )}
              >
                {"icon" in pill && pill.icon ? <pill.icon className="size-3.5" aria-hidden /> : null}
                {pill.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                    visitFilter === pill.id ? "bg-white/15 text-white" : "bg-black/5 text-[#1A5345]",
                  )}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A1F1E]"
            onClick={() => setMonthAnchor((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="min-w-[180px] text-center">
            <p className="text-[13px] font-bold text-[#1A1F1E]">{monthDays.length} days of {monthLabel}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A1F1E]"
            onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#E8E6E0]/60 px-4 py-2 text-[11px] font-medium text-muted-foreground sm:px-5">
        <InfoIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
        Standard appointment slots are 30 minutes. Click an open slot to book.
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 88 + monthDays.length * DAY_COL_WIDTH }}>
          <div className="sticky top-0 z-20 flex border-b border-[#E8E6E0]/60 bg-white">
            <div className="sticky left-0 z-30 w-[88px] shrink-0 border-r border-[#E8E6E0]/60 bg-white" />
            {monthDays.map((day) => {
              const today = isToday(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex shrink-0 flex-col items-center justify-center border-r border-[#E8E6E0]/40 px-1 py-2",
                    today && "bg-[#E8F0EE]/40",
                  )}
                  style={{ width: DAY_COL_WIDTH }}
                >
                  <span
                    className={cn(
                      "text-[15px] font-bold tabular-nums",
                      today ? "text-[#1A5345]" : "text-[#1A1F1E]",
                    )}
                  >
                    {format(day, "dd")}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {format(day, "EEE")}
                  </span>
                  {today ? (
                    <span className="mt-1 rounded-md bg-[#1A5345] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                      Today
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {SLOT_HOURS.map((hour, rowIndex) => {
            const palette = ROW_PALETTES[rowIndex % ROW_PALETTES.length]!
            return (
              <div key={hour} className={cn("flex border-b border-[#E8E6E0]/40", palette.row)}>
                <div
                  className={cn(
                    "sticky left-0 z-10 flex w-[88px] shrink-0 items-center border-r border-[#E8E6E0]/60 px-2 py-3",
                    palette.row,
                  )}
                >
                  <span className={cn("text-[11px] font-bold leading-tight", palette.accent)}>
                    {formatSlotLabel(hour)}
                  </span>
                </div>

                {monthDays.map((day) => {
                  const key = slotKey(day, hour)
                  const cellAppointments = slotMap.get(key) ?? []
                  const isPast = isBefore(
                    new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1),
                    new Date(),
                  )
                  const hasBooking = cellAppointments.length > 0

                  return (
                    <div
                      key={key}
                      className="shrink-0 border-r border-[#E8E6E0]/30 p-1.5"
                      style={{ width: DAY_COL_WIDTH, minHeight: 76 }}
                    >
                      {hasBooking ? (
                        <div className="flex flex-col gap-1">
                          {cellAppointments.map((apt) => (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => onSelectAppointment(apt)}
                              className={cn(
                                "w-full rounded-xl border p-2 text-left shadow-sm transition-opacity hover:opacity-95",
                                palette.card,
                                apt.status === "completed" && "opacity-80",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-7 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white">
                                  <Image
                                    src={
                                      apt.patient.avatar ??
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(apt.patient.name.replace(/\s+/g, ""))}`
                                    }
                                    alt=""
                                    width={28}
                                    height={28}
                                    unoptimized
                                    className="size-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[11px] font-bold text-[#1A1F1E]">
                                    {apt.patient.name}
                                  </p>
                                  <p className="truncate text-[9px] font-medium text-[#6B7870]">
                                    {formatTimeShort(apt.scheduledAt)}
                                    {apt.visitType === "virtual" ? " · Virtual" : " · Clinic"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : isPast ? (
                        <div className="flex h-full min-h-[64px] items-center justify-center rounded-xl border border-dashed border-[#D8D8D4] bg-white/40">
                          <span
                            className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#C4C4C0]"
                            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                          >
                            Empty
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEmptySlotClick(day, hour)}
                          className="flex h-full min-h-[64px] w-full items-center justify-center rounded-xl border border-[#C8E6D5] bg-[#ECFDF5]/70 transition-colors hover:bg-[#D1FAE5]/80"
                        >
                          <PlusIcon className="size-4 text-[#1A5345]/70" aria-hidden />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
