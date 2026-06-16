"use client"

import * as React from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import {
  ArrowRightLeftIcon,
  BanIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ClockIcon,
  CoffeeIcon,
  CopyIcon,
  Loader2Icon,
  ClockPlusIcon,
  PauseIcon,
  PencilLineIcon,
  PlayIcon,
  PrinterIcon,
  SaveIcon,
  SparklesIcon,
  Table2Icon,
  Trash2Icon,
  UsersIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"

import { ScheduleTable } from "@/app/(doctor)/doctor-schedule/ScheduleTable"
import { timeToMinutes } from "@/app/(doctor)/doctor-schedule/doctorSchedule.schema"
import { generateTimeBlockId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.utils"
import {
  WEEKDAY_ORDER,
  type BlockedDate,
  type DayAvailability,
  type DoctorSchedulePayload,
  type TimeBlock,
  type WeekdayId,
} from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { nextCalendarDateForWeekday } from "./assistantDoctorSchedule.date"
import { computeAvailableSlotsForDay } from "./assistantDoctorSchedule.slots"
import type {
  AssistantDoctorScheduleBundle,
  AssistantScheduleDoctor,
  ScheduleBooking,
  ScheduleDayExtra,
} from "./assistantDoctorSchedule.types"
import { AssistantScheduleAiPanel } from "./AssistantScheduleAiPanel"
import {
  runScheduleAiAnalysis,
  sendScheduleAiMessage,
  useAssistantDoctorSchedule,
  useAssistantScheduleDoctors,
} from "./useAssistantDoctorSchedule"
import { AssistantProfileAvatar } from "../AssistantProfileAvatar"

function replaceDay(days: DayAvailability[], next: DayAvailability): DayAvailability[] {
  return days.map((d) => (d.weekday === next.weekday ? next : d))
}

function timeToMins(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function AssistantDayTimeline({
  periods,
  extraPeriods,
  blocks,
  bookings,
}: {
  periods: TimeBlock[]
  extraPeriods: Array<{ id: string; startTime: string; endTime: string }>
  blocks: TimeBlock[]
  bookings: ScheduleBooking[]
}) {
  const totalMins = 24 * 60

  return (
    <div className="w-full select-none pt-1 pb-1">
      <div className="relative h-10 w-full rounded-xl bg-[#F4F3ED] border border-[#E8E6E0] overflow-hidden shadow-inner">
        {[4, 8, 12, 16, 20].map((h) => (
          <div
            key={h}
            className="absolute inset-y-0 border-l border-[#E8E6E0]/40 z-0"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}

        {extraPeriods.map((p) => {
          const start = timeToMins(p.startTime)
          const end = timeToMins(p.endTime)
          if (start >= end) return null
          const left = (start / totalMins) * 100
          const width = ((end - start) / totalMins) * 100
          return (
            <div
              key={p.id}
              className="absolute inset-y-0 z-[11] flex flex-col items-center justify-center overflow-hidden border-x border-[#CC5533]/40 bg-[#CC5533]/90 shadow-sm"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`Extra hours (this date only): ${p.startTime} - ${p.endTime}`}
            >
              {width > 8 ? (
                <span className="whitespace-nowrap px-1 text-[10px] font-bold text-white drop-shadow-sm">
                  +{p.startTime}–{p.endTime}
                </span>
              ) : null}
            </div>
          )
        })}

        {periods.map((p) => {
          const start = timeToMins(p.startTime)
          const end = timeToMins(p.endTime)
          if (start >= end) return null
          const left = (start / totalMins) * 100
          const width = ((end - start) / totalMins) * 100
          const periodBookings = bookings.filter((bk) => {
            const bkStart = timeToMins(bk.startTime)
            const bkEnd = timeToMins(bk.endTime)
            return bkStart >= start && bkEnd <= end
          })
          return (
            <Popover key={p.id}>
              <PopoverTrigger asChild>
                <div
                  className="absolute inset-y-0 bg-[#1A5345] z-10 flex flex-col items-center justify-center overflow-hidden shadow-sm border-x border-[#133F34]/50 transition-all hover:brightness-110 cursor-pointer"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`Weekly hours: ${p.startTime} - ${p.endTime}`}
                >
                  {width > 8 && (
                    <span className="text-[10px] font-bold text-white whitespace-nowrap px-1 drop-shadow-sm">
                      {p.startTime} - {p.endTime}
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-xl border-[#E8E6E0] p-0 shadow-xl" align="center" side="top" sideOffset={6}>
                <div className="h-1 bg-[#1A5345] rounded-t-xl" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E0]/50">
                  <div>
                    <p className="font-bold text-sm text-[#1A1F1E]">Weekly working period</p>
                    <p className="text-xs text-muted-foreground">{p.startTime} – {p.endTime}</p>
                  </div>
                  <Badge className="rounded-md bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">Weekly</Badge>
                </div>
                {periodBookings.length > 0 ? (
                  <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    {periodBookings.map((bk) => (
                        <div key={bk.id} className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                          <Avatar className="size-10 border-2 border-[#E8F0EE] shadow-sm shrink-0">
                            <AvatarImage src={bk.avatarUrl} alt={bk.patientLabel} />
                            <AvatarFallback className="bg-[#F4F3ED]" />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#1A1F1E] truncate">{bk.patientLabel}</p>
                            <p className="text-xs text-muted-foreground">{bk.startTime} – {bk.endTime}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-5 text-sm text-muted-foreground text-center">No bookings in this period</p>
                )}
              </PopoverContent>
            </Popover>
          )
        })}

        {bookings.map((b) => {
          const start = timeToMins(b.startTime)
          const end = timeToMins(b.endTime)
          if (start >= end) return null
          const left = (start / totalMins) * 100
          const width = ((end - start) / totalMins) * 100
          return (
            <Popover key={b.id}>
              <PopoverTrigger asChild>
                <div
                  className="absolute inset-y-0 bg-amber-100 z-20 flex flex-col items-center justify-center overflow-hidden shadow-sm border-x border-amber-300/60 transition-all hover:brightness-105 cursor-pointer"
                  style={{ left: `${left}%`, width: `${width}%`, minWidth: "16px" }}
                  title={`Booking: ${b.startTime} - ${b.endTime}`}
                >
                  {width > 6 && (
                    <span className="text-[10px] font-bold text-amber-800 whitespace-nowrap px-1 drop-shadow-sm">
                      {b.patientLabel}
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72 rounded-xl border-[#E8E6E0] p-0 shadow-xl" align="center" side="top" sideOffset={6}>
                <div className="h-1.5 bg-amber-400 rounded-t-xl" />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 border-2 border-amber-100 shadow-sm shrink-0">
                      <AvatarImage src={b.avatarUrl} alt={b.patientLabel} />
                      <AvatarFallback className="bg-[#F4F3ED]" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[15px] text-[#1A1F1E] truncate">{b.patientLabel}</p>
                      <p className="text-xs text-muted-foreground">{b.startTime} – {b.endTime}</p>
                      <Badge className="mt-1.5 rounded-full bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold px-2.5 py-0.5">Confirmed</Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 flex-1 rounded-lg border-[#E8E6E0] text-[13px] font-semibold hover:bg-[#FAFAF8]">
                      Details
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-[#E8E6E0] text-muted-foreground hover:bg-[#FAFAF8] hover:text-[#1A1F1E]">
                      <PencilLineIcon className="size-3.5" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600">
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}

        {blocks.map((b) => {
          const start = timeToMins(b.startTime)
          const end = timeToMins(b.endTime)
          if (start >= end) return null
          const left = (start / totalMins) * 100
          const width = ((end - start) / totalMins) * 100
          return (
            <Popover key={b.id}>
              <PopoverTrigger asChild>
                <div
                  className="absolute inset-y-0 bg-red-50 z-20 flex flex-col items-center justify-center overflow-hidden shadow-sm border-x border-red-200/60 transition-all hover:brightness-105 cursor-pointer"
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`Break: ${b.startTime} - ${b.endTime}`}
                >
                  <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#fca5a5_4px,#fca5a5_8px)]" />
                  {width > 6 && (
                    <span className="text-[10px] font-bold text-red-700 relative z-10 whitespace-nowrap px-1 bg-white/90 rounded-sm shadow-sm">
                      Break
                    </span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 rounded-xl border-[#E8E6E0] p-0 shadow-lg" align="center" side="top" sideOffset={6}>
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="size-10 border border-[#E8E6E0]">
                    <AvatarFallback className="bg-red-50 text-red-500">
                      <CoffeeIcon className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A1F1E] truncate">Break</p>
                    <p className="text-xs text-muted-foreground">{b.startTime} – {b.endTime}</p>
                  </div>
                </div>
                <div className="border-t border-[#E8E6E0]/50 px-3 py-2 flex items-center justify-between">
                  <Badge className="rounded-md bg-red-50 text-red-600 border-red-200 text-[10px] font-bold">Blocked</Badge>
                  <span className="text-[10px] text-muted-foreground">Block ID: {b.id.slice(-4)}</span>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>

      <div className="relative w-full h-4 mt-1.5">
        <span className="absolute left-0 text-[10px] font-medium text-muted-foreground">12 AM</span>
        <span className="absolute left-[16.66%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
          4 AM
        </span>
        <span className="absolute left-[33.33%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
          8 AM
        </span>
        <span className="absolute left-[50%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
          12 PM
        </span>
        <span className="absolute left-[66.66%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
          4 PM
        </span>
        <span className="absolute left-[83.33%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">
          8 PM
        </span>
        <span className="absolute right-0 text-[10px] font-medium text-muted-foreground">
          11:59 PM
        </span>
      </div>
    </div>
  )
}

type ViewMode = "week" | "day" | "blocked" | "calendar" | "ai"

function buildScheduleExportSummary(
  schedule: DoctorSchedulePayload,
  doctorName: string,
  bookingCount: number,
  pausedCount: number
): string {
  const lines: string[] = []
  lines.push(`ICARE-CVD — Doctor schedule export`)
  lines.push(`Doctor: ${doctorName}`)
  lines.push(
    `Slot length: ${schedule.slotDurationMinutes} min · Buffer: ${schedule.bufferBetweenSlotsMinutes} min`
  )
  lines.push(`Upcoming bookings: ${bookingCount} · Paused sessions: ${pausedCount}`)
  lines.push("")
  lines.push("Weekly pattern (by weekday)")
  for (const day of schedule.days) {
    if (!day.enabled) {
      lines.push(`- ${day.label}: closed`)
      continue
    }
    const periods = day.periods.map((p) => `${p.startTime}–${p.endTime}`).join(", ") || "none"
    const blocks =
      day.unavailableBlocks.map((b) => `${b.startTime}–${b.endTime}`).join(", ") || "none"
    lines.push(`- ${day.label}: ${periods} · breaks: ${blocks}`)
  }
  lines.push("")
  lines.push("Blocked calendar dates")
  if (schedule.blockedDates.length === 0) {
    lines.push("- (none)")
  } else {
    for (const b of schedule.blockedDates) {
      lines.push(`- ${b.date}${b.reason ? ` — ${b.reason}` : ""}`)
    }
  }
  return lines.join("\n")
}

function ScheduleMonthCalendar({
  monthCursor,
  onMonthChange,
  blockedDates,
}: {
  monthCursor: Date
  onMonthChange: (next: Date) => void
  blockedDates: BlockedDate[]
}) {
  const calendarDays = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [monthCursor])

  const blockedByIso = React.useMemo(() => {
    const map = new Map<string, BlockedDate>()
    for (const b of blockedDates) {
      map.set(b.date, b)
    }
    return map
  }, [blockedDates])

  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col overflow-hidden rounded-3xl border border-[#E8E6E0]/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.02)] animate-in zoom-in-95 duration-500">
        <div className="flex flex-col gap-3 border-b border-[#E8E6E0]/60 bg-[#FAFAF8]/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-1 rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg sm:size-9"
              aria-label="Previous month"
              onClick={() => onMonthChange(startOfMonth(subMonths(monthCursor, 1)))}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="min-w-[9.5rem] px-2 text-center font-serif text-[13px] font-bold text-[#1A1F1E] sm:min-w-[11rem] sm:text-[14px]">
              {format(monthCursor, "MMMM yyyy")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg sm:size-9"
              aria-label="Next month"
              onClick={() => onMonthChange(startOfMonth(addMonths(monthCursor, 1)))}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground sm:text-right sm:text-[12px]">
            Sun–Sat grid · blocked days match the Blocked dates list
          </p>
        </div>

        <div className="grid grid-cols-7 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-r border-[#E8E6E0]/40 px-2 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground last:border-r-0 sm:px-4 sm:text-[12px]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid min-h-[480px] auto-rows-fr grid-cols-7 sm:min-h-[560px]">
          {calendarDays.map((day, idx) => {
            const iso = format(day, "yyyy-MM-dd")
            const inMonth = isSameMonth(day, monthCursor)
            const blocked = blockedByIso.get(iso)
            const isTodayDay = isToday(day)

            const cellBody = (
              <>
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                      isTodayDay ? "bg-[#1A5345] text-white" : "text-[#102F27]"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {blocked && inMonth ? (
                    <span className="shrink-0 rounded-md bg-[#CC5533]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#A34429] sm:text-[10px]">
                      Off
                    </span>
                  ) : null}
                </div>

                {inMonth && blocked ? (
                  <div className="mt-auto flex flex-1 flex-col justify-end gap-1">
                    <div className="flex flex-wrap content-start gap-1">
                      <Badge
                        variant="outline"
                        className="rounded-lg border-[#CC5533]/30 bg-white px-2 py-0.5 text-[10px] font-bold text-[#A34429]"
                      >
                        Blocked
                      </Badge>
                    </div>
                    {blocked.reason ? (
                      <p className="line-clamp-3 text-[11px] font-medium leading-snug text-muted-foreground">
                        {blocked.reason}
                      </p>
                    ) : (
                      <p className="text-[11px] font-medium text-muted-foreground">No sessions</p>
                    )}
                  </div>
                ) : inMonth && !blocked ? (
                  <div className="mt-auto flex flex-1 flex-col justify-end">
                    <p className="text-[11px] font-medium text-muted-foreground/60">Available</p>
                  </div>
                ) : null}
              </>
            )

            return (
              <div
                key={iso}
                className={cn(
                  "flex min-h-[100px] flex-col border-b border-r border-[#E8E6E0]/40 transition-colors sm:min-h-[120px]",
                  !inMonth && "bg-[#F9F8F5]/30 opacity-40",
                  inMonth && "hover:bg-[#1A5345]/[0.02]",
                  idx % 7 === 6 && "border-r-0",
                  blocked && inMonth && "bg-[#CC5533]/[0.04]"
                )}
              >
                {blocked && inMonth ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="flex flex-1 flex-col p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {cellBody}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px]">
                      <p className="text-[12px] font-semibold text-[#1A1F1E]">Blocked day</p>
                      {blocked.reason ? (
                        <p className="text-[11px] text-muted-foreground">{blocked.reason}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">No reason provided.</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="flex flex-1 flex-col p-2">{cellBody}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t border-[#E8E6E0]/50 bg-[#F9F8F5]/50 px-4 py-3 text-[11px] text-muted-foreground sm:text-[12px]">
          Weekly working hours repeat every week. Warm tint = blocked; solid green circle =
          today.
        </div>
      </div>
    </TooltipProvider>
  )
}

function DailySessionsPanel({
  days,
  pausedPeriodIds,
  onTogglePause,
  onDayChange,
  scheduleDraft,
  bookings,
  onMoveBooking,
  isMovingBooking,
  onCancelBooking,
  isCancellingBooking,
  cancellingBookingId,
  doctorArrivalByWeekday,
  onSetDoctorArrival,
  isSettingArrival,
  dayExtras,
  onCreateDayExtra,
  isCreatingDayExtra,
  onDeleteDayExtra,
  isDeletingDayExtra,
  deletingDayExtraId,
  disabled,
}: {
  days: DayAvailability[]
  pausedPeriodIds: string[]
  onTogglePause: (periodId: string) => void
  onDayChange: (next: DayAvailability) => void
  scheduleDraft: DoctorSchedulePayload
  bookings: ScheduleBooking[]
  onMoveBooking: (bookingId: string, startTime: string, endTime: string) => Promise<unknown>
  isMovingBooking: boolean
  onCancelBooking: (bookingId: string) => void
  isCancellingBooking: boolean
  cancellingBookingId: string | null
  doctorArrivalByWeekday: Partial<Record<WeekdayId, string | null>>
  onSetDoctorArrival: (weekday: WeekdayId, arrivalTime: string | null) => void
  isSettingArrival: boolean
  dayExtras: ScheduleDayExtra[]
  onCreateDayExtra: (payload: {
    date: string
    startTime: string
    endTime: string
    reason?: string
  }) => Promise<unknown>
  isCreatingDayExtra: boolean
  onDeleteDayExtra: (extraId: string) => void
  isDeletingDayExtra: boolean
  deletingDayExtraId: string | null
  disabled: boolean
}) {
  const [weekday, setWeekday] = React.useState<WeekdayId>("monday")
  const [calendarDate, setCalendarDate] = React.useState(() => nextCalendarDateForWeekday("monday"))
  const [extraStart, setExtraStart] = React.useState("21:00")
  const [extraEnd, setExtraEnd] = React.useState("22:00")
  const [extraReason, setExtraReason] = React.useState("")

  const day = days.find((d) => d.weekday === weekday)

  React.useEffect(() => {
    setCalendarDate(nextCalendarDateForWeekday(weekday))
  }, [weekday])

  const dateExtras = React.useMemo(
    () => dayExtras.filter((e) => e.date === calendarDate),
    [calendarDate, dayExtras]
  )

  const extraPeriodsForSlots = React.useMemo(
    () => dateExtras.map((e) => ({ startTime: e.startTime, endTime: e.endTime })),
    [dateExtras]
  )

  const extraTimelinePeriods = React.useMemo(
    () => dateExtras.map((e) => ({ id: e.id, startTime: e.startTime, endTime: e.endTime })),
    [dateExtras]
  )

  const dayBookings = React.useMemo(
    () => bookings.filter((b) => b.scheduledDate === calendarDate),
    [bookings, calendarDate]
  )

  const [moveBookingOpenId, setMoveBookingOpenId] = React.useState<string | null>(null)

  const [editingBlock, setEditingBlock] = React.useState<TimeBlock | null>(null)
  const [editStart, setEditStart] = React.useState("")
  const [editEnd, setEditEnd] = React.useState("")
  const [editError, setEditError] = React.useState<string | null>(null)

  // Local draft of the arrival time input before confirming
  const currentArrival = doctorArrivalByWeekday[weekday] ?? null
  const [arrivalDraft, setArrivalDraft] = React.useState(currentArrival ?? "")

  // Sync draft when switching weekdays
  React.useEffect(() => {
    setArrivalDraft(doctorArrivalByWeekday[weekday] ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday])

  const handleApplyArrival = () => {
    const hm = /^\d{2}:\d{2}$/
    const val = arrivalDraft.trim().slice(0, 5)
    if (val === "") {
      onSetDoctorArrival(weekday, null)
      return
    }
    if (!hm.test(val)) {
      toast.error("Invalid time", { description: "Use HH:mm (24h format)." })
      return
    }
    onSetDoctorArrival(weekday, val)
  }

  const handleClearArrival = () => {
    setArrivalDraft("")
    onSetDoctorArrival(weekday, null)
  }

  const openBlockEditor = (b: TimeBlock) => {
    setEditStart(b.startTime)
    setEditEnd(b.endTime)
    setEditError(null)
    setEditingBlock(b)
  }

  const closeBlockEditor = () => {
    setEditingBlock(null)
    setEditError(null)
  }

  const handleRemoveUnavailableBlock = (blockId: string) => {
    if (!day) return
    onDayChange({
      ...day,
      unavailableBlocks: day.unavailableBlocks.filter((b) => b.id !== blockId),
    })
  }

  const handleApplyBlockEdit = () => {
    if (!day || !editingBlock) return
    const norm = (s: string) => (s.length >= 5 ? s.slice(0, 5) : s)
    const start = norm(editStart)
    const end = norm(editEnd)
    const hm = /^\d{2}:\d{2}$/
    if (!hm.test(start) || !hm.test(end)) {
      setEditError("Use HH:mm (24h).")
      return
    }
    if (timeToMinutes(start) >= timeToMinutes(end)) {
      setEditError("End time must be after start.")
      return
    }
    onDayChange({
      ...day,
      unavailableBlocks: day.unavailableBlocks.map((b) =>
        b.id === editingBlock.id ? { ...b, startTime: start, endTime: end } : b
      ),
    })
    closeBlockEditor()
  }

  const moveSlots = React.useMemo(() => {
    if (!day || !moveBookingOpenId) return []
    const bk = dayBookings.find((b) => b.id === moveBookingOpenId)
    if (!bk) return []
    const slots = computeAvailableSlotsForDay({
      day,
      slotDurationMinutes: scheduleDraft.slotDurationMinutes,
      bufferBetweenSlotsMinutes: scheduleDraft.bufferBetweenSlotsMinutes,
      pausedPeriodIds,
      bookings,
      weekday: day.weekday,
      scheduledDate: bk.scheduledDate,
      excludeBookingId: moveBookingOpenId,
      doctorArrivalTime: doctorArrivalByWeekday[day.weekday],
      extraPeriods: extraPeriodsForSlots,
    })
    return slots.filter((s) => !(s.startTime === bk.startTime && s.endTime === bk.endTime))
  }, [
    day,
    dayBookings,
    bookings,
    doctorArrivalByWeekday,
    moveBookingOpenId,
    pausedPeriodIds,
    scheduleDraft.bufferBetweenSlotsMinutes,
    scheduleDraft.slotDurationMinutes,
    extraPeriodsForSlots,
  ])

  const handleAddExtraHours = async () => {
    const hm = /^\d{2}:\d{2}$/
    const start = extraStart.trim().slice(0, 5)
    const end = extraEnd.trim().slice(0, 5)
    if (!hm.test(start) || !hm.test(end)) {
      toast.error("Invalid time", { description: "Use HH:mm (24h format)." })
      return
    }
    if (timeToMinutes(start) >= timeToMinutes(end)) {
      toast.error("Invalid range", { description: "End time must be after start time." })
      return
    }
    await onCreateDayExtra({
      date: calendarDate,
      startTime: start,
      endTime: end,
      reason: extraReason.trim() || undefined,
    })
    setExtraReason("")
  }

  const handleConfirmMove = async (bookingId: string, startTime: string, endTime: string) => {
    await onMoveBooking(bookingId, startTime, endTime)
    setMoveBookingOpenId(null)
  }

  return (
    <div className="space-y-4">
      <Dialog
        open={editingBlock !== null}
        onOpenChange={(open) => {
          if (!open) closeBlockEditor()
        }}
      >
        <DialogContent className="rounded-xl sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="font-serif">Edit break window</DialogTitle>
            <DialogDescription>
              Lunch and meetings block bookings inside working hours. This is not moving a patient
              appointment; use Move to free slot on a booked row for that.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="block-edit-start" className="text-xs font-semibold">
                Start
              </Label>
              <Input
                id="block-edit-start"
                type="time"
                className="h-10 rounded-xl"
                value={editStart}
                onChange={(e) => {
                  setEditStart(e.target.value)
                  setEditError(null)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-edit-end" className="text-xs font-semibold">
                End
              </Label>
              <Input
                id="block-edit-end"
                type="time"
                className="h-10 rounded-xl"
                value={editEnd}
                onChange={(e) => {
                  setEditEnd(e.target.value)
                  setEditError(null)
                }}
              />
            </div>
          </div>
          {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              onClick={closeBlockEditor}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-lg bg-[#1A5345] font-bold text-white hover:bg-[#133F34]"
              onClick={handleApplyBlockEdit}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Day
            </Label>
            <Select value={weekday} onValueChange={(v) => setWeekday(v as WeekdayId)}>
              <SelectTrigger className="h-10 w-full max-w-xs rounded-xl border-[#E8E6E0] bg-white sm:w-[220px]">
                <SelectValue placeholder="Pick a day" />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_ORDER.map((w) => {
                  const d = days.find((x) => x.weekday === w)
                  return (
                    <SelectItem key={w} value={w}>
                      {d?.label ?? w}
                      {d?.enabled ? "" : " (off)"}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {day ? (
            <Badge
              variant="secondary"
              className={cn(
                "w-fit rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                day.enabled
                  ? "border-[#1A5345]/20 bg-[#E8F0EE] text-[#1A5345]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {day.enabled ? "Clinic open" : "Day off"}
            </Badge>
          ) : null}
        </div>

        {/* ── Extra hours (this calendar date only) ── */}
        <div className="space-y-4 rounded-2xl border border-l-4 border-l-[#CC5533] border-[#E8E6E0]/60 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-[#CC5533]" aria-hidden />
                <Label className="text-[12px] font-bold uppercase tracking-wider text-[#1A1F1E]">
                  Extra hours (this date only)
                </Label>
              </div>
              <p className="text-[13px] font-medium leading-relaxed text-muted-foreground">
                Adds bookable slots for{" "}
                <span className="font-bold text-[#1A1F1E]">{calendarDate}</span>
                {" "}only. The doctor&apos;s weekly template does not change.
              </p>
            </div>
            <ClockPlusIcon className="size-4 shrink-0 text-[#CC5533]" aria-hidden />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`extra-date-${weekday}`} className="text-xs font-semibold">
                Calendar date
              </Label>
              <Input
                id={`extra-date-${weekday}`}
                type="date"
                className="h-9 w-full min-w-[160px] rounded-xl sm:w-44"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`extra-start-${weekday}`} className="text-xs font-semibold">
                From
              </Label>
              <Input
                id={`extra-start-${weekday}`}
                type="time"
                className="h-9 w-32 rounded-xl"
                value={extraStart}
                onChange={(e) => setExtraStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`extra-end-${weekday}`} className="text-xs font-semibold">
                To
              </Label>
              <Input
                id={`extra-end-${weekday}`}
                type="time"
                className="h-9 w-32 rounded-xl"
                value={extraEnd}
                onChange={(e) => setExtraEnd(e.target.value)}
              />
            </div>
            <div className="min-w-[160px] flex-1 space-y-1.5">
              <Label htmlFor={`extra-reason-${weekday}`} className="text-xs font-semibold">
                Reason (optional)
              </Label>
              <Input
                id={`extra-reason-${weekday}`}
                className="h-9 rounded-xl"
                placeholder="Emergency extension…"
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:bg-[#133F34]"
              disabled={isCreatingDayExtra || disabled}
              onClick={() => void handleAddExtraHours()}
            >
              {isCreatingDayExtra ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                "Add extra hours"
              )}
            </Button>
          </div>
          {dateExtras.length > 0 ? (
            <ul className="space-y-2 border-t border-[#E8E6E0]/60 pt-4">
              {dateExtras.map((extra) => (
                <li
                  key={extra.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] px-3.5 py-2.5 transition-all hover:shadow-sm"
                >
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1F1E]">
                      <span className="text-[#CC5533]">{extra.startTime}</span>
                      {" – "}
                      <span className="text-[#CC5533]">{extra.endTime}</span>
                    </p>
                    {extra.reason ? (
                      <p className="text-[11px] font-medium text-muted-foreground">{extra.reason}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg border-[#E8E6E0] text-destructive hover:bg-destructive/10"
                    disabled={isDeletingDayExtra}
                    onClick={() => onDeleteDayExtra(extra.id)}
                  >
                    {isDeletingDayExtra && deletingDayExtraId === extra.id ? (
                      <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2Icon className="size-3.5" aria-hidden />
                    )}
                    <span className="sr-only">Remove extra hours</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* ── Doctor arrival time control ── */}
        <div
          className={cn(
            "flex flex-wrap items-end gap-3 rounded-xl border px-4 py-3 transition-colors",
            currentArrival
              ? "border-amber-300/70 bg-amber-50/60"
              : "border-[#E8E6E0]/70 bg-[#FAFAF8]/60"
          )}
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <ClockIcon
                className={cn(
                  "size-3.5",
                  currentArrival ? "text-amber-600" : "text-muted-foreground"
                )}
                aria-hidden
              />
              <Label
                htmlFor={`arrival-${weekday}`}
                className={cn(
                  "text-xs font-bold uppercase tracking-wide",
                  currentArrival ? "text-amber-700" : "text-muted-foreground"
                )}
              >
                Doctor arrival time
              </Label>
              {currentArrival ? (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  Delayed — slots from {currentArrival}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/70">
                  Set to push free slots when the doctor is running late
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Existing bookings stay as-is. Only new (free) available slots are shifted.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id={`arrival-${weekday}`}
              type="time"
              className={cn(
                "h-9 w-36 rounded-xl text-sm",
                currentArrival &&
                  "border-amber-300 bg-amber-50 text-amber-800 focus-visible:ring-amber-400"
              )}
              value={arrivalDraft}
              onChange={(e) => setArrivalDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyArrival()
              }}
              disabled={isSettingArrival || disabled}
            />
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg bg-[#1A5345] px-3 font-bold text-white hover:bg-[#133F34]"
              disabled={isSettingArrival || disabled}
              onClick={handleApplyArrival}
            >
              {isSettingArrival ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                "Set"
              )}
            </Button>
            {currentArrival ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 rounded-lg border-amber-300 px-2 text-amber-700 hover:bg-amber-50"
                disabled={isSettingArrival || disabled}
                onClick={handleClearArrival}
              >
                <XCircleIcon className="size-3.5" aria-hidden />
                <span className="sr-only">Clear arrival</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {!day?.enabled ? (
        <p className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#FAFAF8] px-4 py-8 text-center text-sm text-muted-foreground">
          This weekday is turned off in the weekly table. Enable it under “Weekly table” to manage
          sessions here.
        </p>
      ) : (
        <div className="space-y-5">
          <AssistantDayTimeline
            periods={day.periods}
            extraPeriods={extraTimelinePeriods}
            blocks={day.unavailableBlocks}
            bookings={dayBookings}
          />

          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1F1E]">
            <BriefcaseIcon className="size-4 text-[#1A5345]" />
            Working sessions
            <span className="ml-1 rounded-full bg-[#E8F0EE] px-2 py-0.5 text-[10px] font-bold text-[#1A5345]">
              {day.periods.length}
            </span>
          </div>
          {day.periods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No working periods for this day.</p>
          ) : (
            <ul className="space-y-2">
              {day.periods.map((p) => {
                const paused = pausedPeriodIds.includes(p.id)
                return (
                  <li
                    key={p.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm",
                      paused
                        ? "border-[#CC5533]/35 bg-[#CC5533]/[0.06]"
                        : "border-[#E8E6E0]/80 bg-white"
                    )}
                  >
                    <div>
                      <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                        {p.startTime} – {p.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">Session ID: {p.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {paused ? "Paused" : "Active"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={paused ? "outline" : "secondary"}
                        className={cn(
                          "h-8 gap-1.5 rounded-lg px-3 text-xs font-bold",
                          paused
                            ? "border-[#1A5345]/25 text-[#1A5345]"
                            : "bg-[#CC5533]/12 text-[#A34429] hover:bg-[#CC5533]/18"
                        )}
                        disabled={disabled}
                        onClick={() => onTogglePause(p.id)}
                      >
                        {paused ? (
                          <>
                            <PlayIcon className="size-3.5" aria-hidden />
                            Resume
                          </>
                        ) : (
                          <>
                            <PauseIcon className="size-3.5" aria-hidden />
                            Pause
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {dayBookings.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1F1E]">
                <UsersIcon className="size-4 text-amber-600" />
                Booked slots
                <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  {dayBookings.length}
                </span>
              </div>
              <ul className="space-y-2">
                {dayBookings.map((bk) => (
                  <li
                    key={bk.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/80 bg-white px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                        {bk.startTime} – {bk.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bk.patientLabel}
                        {bk.scheduledDate ? ` · ${bk.scheduledDate}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isMovingBooking || isCancellingBooking}
                        className="h-8 gap-1.5 rounded-lg border-[#E8E6E0] px-3 text-xs font-bold text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setMoveBookingOpenId(null)
                          onCancelBooking(bk.id)
                        }}
                      >
                        {isCancellingBooking && cancellingBookingId === bk.id ? (
                          <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Trash2Icon className="size-3.5" aria-hidden />
                        )}
                        Cancel booking
                      </Button>
                      <Popover
                        open={moveBookingOpenId === bk.id}
                        onOpenChange={(open) => setMoveBookingOpenId(open ? bk.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={isMovingBooking || isCancellingBooking}
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs font-bold bg-[#CC5533]/12 text-[#A34429] hover:bg-[#CC5533]/18"
                          >
                            {isMovingBooking && moveBookingOpenId === bk.id ? (
                              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                            ) : (
                              <ArrowRightLeftIcon className="size-3.5" aria-hidden />
                            )}
                            Move to free slot
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[min(100vw-2rem,360px)] max-w-md rounded-xl border-[#E8E6E0] p-0"
                          align="end"
                        >
                          <Command>
                            <CommandInput placeholder="Search available times…" className="h-10" />
                            <CommandList className="max-h-[min(280px,40vh)]">
                              <CommandEmpty className="py-6 text-sm text-muted-foreground">
                                No free slots. Try another day, resume a paused session, or shorten
                                breaks in the weekly table.
                              </CommandEmpty>
                              <CommandGroup>
                                {moveSlots.map((slot) => (
                                  <CommandItem
                                    key={slot.key}
                                    value={`${slot.startTime} ${slot.endTime} available`}
                                    disabled={isMovingBooking || isCancellingBooking}
                                    onSelect={() =>
                                      void handleConfirmMove(bk.id, slot.startTime, slot.endTime)
                                    }
                                    className="cursor-pointer rounded-lg font-medium data-[selected=true]:bg-[#E8F0EE]/70"
                                  >
                                    {slot.startTime} – {slot.endTime}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {day.unavailableBlocks.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1F1E]">
                <CoffeeIcon className="size-4 text-red-500" />
                Breaks
                <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  {day.unavailableBlocks.length}
                </span>
              </div>
              <ul className="space-y-2">
                {day.unavailableBlocks.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5] px-4 py-3 shadow-sm"
                  >
                    <div>
                      <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                        {b.startTime} – {b.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Not bookable inside working hours
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 gap-1.5 rounded-lg px-3 text-xs font-bold bg-[#CC5533]/12 text-[#A34429] hover:bg-[#CC5533]/18"
                        onClick={() => openBlockEditor(b)}
                      >
                        <PencilLineIcon className="size-3.5" aria-hidden />
                        Edit break
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 rounded-lg border-[#E8E6E0] px-3 text-xs font-bold text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveUnavailableBlock(b.id)}
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function doctorSearchKeywords(d: AssistantScheduleDoctor) {
  return [d.name, d.specialty ?? ""].filter(Boolean).join(" ")
}

function DoctorPickerAvatar({ doctor }: { doctor: AssistantScheduleDoctor }) {
  return (
    <AssistantProfileAvatar
      name={doctor.name}
      avatarUrl={doctor.avatarUrl}
      className="size-10 shrink-0 rounded-xl border border-[#E8E6E0]/80 shadow-sm"
      initialsClassName="text-[13px]"
      sizes="40px"
    />
  )
}

function DoctorScheduleDoctorPicker({
  doctors,
  doctorId,
  onDoctorIdChange,
}: {
  doctors: AssistantScheduleDoctor[]
  doctorId: string
  onDoctorIdChange: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selected = doctors.find((d) => d.id === doctorId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="doctor-select"
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="h-auto min-h-12 w-full max-w-md justify-between rounded-xl border-[#E8E6E0] bg-white px-2 py-2 font-normal hover:bg-[#FAFAF8]"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {selected ? (
              <>
                <DoctorPickerAvatar doctor={selected} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight text-[#1A1F1E]">
                    {selected.name}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {selected.specialty ?? "Cardiology"}
                  </p>
                </div>
              </>
            ) : (
              <span className="text-muted-foreground">Choose doctor</span>
            )}
          </div>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-w-md rounded-xl border-[#E8E6E0] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search by name or specialty…" className="h-10" />
          <CommandList className="max-h-[min(320px,48vh)]">
            <CommandEmpty className="py-6 text-sm text-muted-foreground">
              No doctor matches.
            </CommandEmpty>
            <CommandGroup>
              {doctors.map((d) => (
                <CommandItem
                  key={d.id}
                  value={`${doctorSearchKeywords(d)} ${d.id}`}
                  onSelect={() => {
                    onDoctorIdChange(d.id)
                    setOpen(false)
                  }}
                  className="min-h-12 cursor-pointer rounded-xl border border-transparent py-2 pl-2 pr-2 outline-none data-[selected=true]:border-[#1A5345]/12 data-[selected=true]:bg-[#E8F0EE]/70"
                >
                  <div className="flex w-full min-w-0 items-center gap-3">
                    <DoctorPickerAvatar doctor={d} />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold leading-tight text-[#1A1F1E]">
                        {d.name}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {d.specialty ?? "Cardiology"}
                      </p>
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto size-4 shrink-0 text-[#1A5345]",
                        d.id !== doctorId && "invisible"
                      )}
                      aria-hidden
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type AssistantDoctorScheduleBodyProps = {
  doctorId: string
  bundle: AssistantDoctorScheduleBundle
  saveScheduleAsync: (s: DoctorSchedulePayload) => Promise<unknown>
  isSaving: boolean
  togglePeriodPause: (periodId: string) => void
  isTogglingPause: boolean
  moveBookingAsync: (args: {
    bookingId: string
    startTime: string
    endTime: string
    schedule: DoctorSchedulePayload
    bookings: ScheduleBooking[]
  }) => Promise<unknown>
  isMovingBooking: boolean
  cancelBooking: (bookingId: string) => void
  isCancellingBooking: boolean
  cancellingBookingId: string | null
  doctorName: string
  setDoctorArrival: (args: { weekday: WeekdayId; arrivalTime: string | null }) => void
  isSettingArrival: boolean
  createDayExtraAsync: (payload: {
    date: string
    startTime: string
    endTime: string
    reason?: string
  }) => Promise<unknown>
  isCreatingDayExtra: boolean
  deleteDayExtra: (extraId: string) => void
  isDeletingDayExtra: boolean
  deletingDayExtraId: string | null
}

function AssistantDoctorScheduleBody({
  doctorId,
  bundle,
  saveScheduleAsync,
  isSaving,
  togglePeriodPause,
  isTogglingPause,
  moveBookingAsync,
  isMovingBooking,
  cancelBooking,
  isCancellingBooking,
  cancellingBookingId,
  setDoctorArrival,
  isSettingArrival,
  createDayExtraAsync,
  isCreatingDayExtra,
  deleteDayExtra,
  isDeletingDayExtra,
  deletingDayExtraId,
  doctorName,
}: AssistantDoctorScheduleBodyProps) {
  const [view, setView] = React.useState<ViewMode>("week")
  const [draft, setDraft] = React.useState(() => structuredClone(bundle.schedule))
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date())
  const [exportOpen, setExportOpen] = React.useState(false)
  const [newBlockedDate, setNewBlockedDate] = React.useState("")
  const [newBlockedReason, setNewBlockedReason] = React.useState("")

  const bookingCount = bundle.bookings.length
  const pausedCount = bundle.pausedPeriodIds.length

  const exportText = React.useMemo(
    () => buildScheduleExportSummary(draft, doctorName, bookingCount, pausedCount),
    [draft, doctorName, bookingCount, pausedCount]
  )

  const hasChanges = React.useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(bundle.schedule),
    [draft, bundle.schedule]
  )

  React.useEffect(() => {
    const order: ViewMode[] = ["week", "day", "blocked", "calendar", "ai"]
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return
      const idx =
        e.key === "1"
          ? 0
          : e.key === "2"
            ? 1
            : e.key === "3"
              ? 2
              : e.key === "4"
                ? 3
                : e.key === "5"
                  ? 4
                  : -1
      if (idx >= 0) {
        e.preventDefault()
        setView(order[idx]!)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleDayChange = React.useCallback((next: DayAvailability) => {
    setDraft((prev) => ({ ...prev, days: replaceDay(prev.days, next) }))
  }, [])

  const handleNumeric = (
    field: "slotDurationMinutes" | "bufferBetweenSlotsMinutes",
    raw: string
  ) => {
    const n = Number(raw)
    if (!Number.isFinite(n)) return
    setDraft((prev) => ({ ...prev, [field]: Math.max(0, Math.min(240, Math.round(n))) }))
  }

  const handleSave = async () => {
    await saveScheduleAsync(draft)
  }

  const handleAddBlockedDate = () => {
    const hm = /^\d{4}-\d{2}-\d{2}$/
    if (!hm.test(newBlockedDate)) {
      toast.error("Invalid date", {
        description: "Use YYYY-MM-DD (pick from the calendar field).",
      })
      return
    }
    if (draft.blockedDates.some((b) => b.date === newBlockedDate)) {
      toast.error("Already blocked", { description: "That date is already in the list." })
      return
    }
    const next: BlockedDate = {
      id: `bd-${generateTimeBlockId()}`,
      date: newBlockedDate,
      reason: newBlockedReason.trim() ? newBlockedReason.trim() : undefined,
    }
    setDraft((prev) => ({ ...prev, blockedDates: [...prev.blockedDates, next] }))
    setNewBlockedDate("")
    setNewBlockedReason("")
    toast.success("Blocked date added", { description: "Save the schedule to persist to the database." })
  }

  const handleRemoveBlockedDate = (id: string) => {
    setDraft((prev) => ({ ...prev, blockedDates: prev.blockedDates.filter((b) => b.id !== id) }))
  }

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Could not copy", { description: "Select the text manually in the dialog." })
    }
  }

  return (
    <>
      <TooltipProvider delay={200}>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E8E6E0]/70 bg-white p-1.5 shadow-sm">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={view === "week" ? "default" : "ghost"}
                  className={cn(
                    "rounded-lg px-3 sm:px-4",
                    view === "week"
                      ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                      : "text-[#1A1F1E]"
                  )}
                  onClick={() => setView("week")}
                >
                  <Table2Icon className="mr-2 size-4 shrink-0" aria-hidden />
                  <span className="truncate">Weekly table</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Edit the weekly grid and slot settings. Shortcut:{" "}
                <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
                  1
                </kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={view === "day" ? "default" : "ghost"}
                  className={cn(
                    "rounded-lg px-3 sm:px-4",
                    view === "day" ? "bg-[#1A5345] text-white hover:bg-[#133F34]" : "text-[#1A1F1E]"
                  )}
                  onClick={() => setView("day")}
                >
                  <CalendarDaysIcon className="mr-2 size-4 shrink-0" aria-hidden />
                  <span className="truncate">Daily sessions</span>
                  <span className="ml-1.5 hidden items-center gap-1 sm:inline-flex">
                    {bookingCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-md px-1.5 text-[10px] font-bold tabular-nums text-[#1A1F1E]"
                      >
                        {bookingCount} bk
                      </Badge>
                    ) : null}
                    {pausedCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="h-5 rounded-md border-[#CC5533]/35 px-1.5 text-[10px] font-bold tabular-nums text-[#A34429]"
                      >
                        {pausedCount} pause
                      </Badge>
                    ) : null}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Sessions, upcoming bookings, and breaks for one weekday. Shortcut:{" "}
                <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
                  2
                </kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={view === "blocked" ? "default" : "ghost"}
                  className={cn(
                    "rounded-lg px-3 sm:px-4",
                    view === "blocked"
                      ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                      : "text-[#1A1F1E]"
                  )}
                  onClick={() => setView("blocked")}
                >
                  <BanIcon className="mr-2 size-4 shrink-0" aria-hidden />
                  <span className="truncate">Blocked dates</span>
                  {draft.blockedDates.length > 0 ? (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 rounded-md px-1.5 text-[10px] font-bold tabular-nums text-[#1A1F1E]"
                    >
                      {draft.blockedDates.length}
                    </Badge>
                  ) : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Full-day closures (vacation, conference). Shortcut:{" "}
                <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
                  3
                </kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={view === "calendar" ? "default" : "ghost"}
                  className={cn(
                    "rounded-lg px-3 sm:px-4",
                    view === "calendar"
                      ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                      : "text-[#1A1F1E]"
                  )}
                  onClick={() => setView("calendar")}
                >
                  <CalendarRangeIcon className="mr-2 size-4 shrink-0" aria-hidden />
                  <span className="truncate">Calendar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Month view with blocked dates highlighted. Shortcut:{" "}
                <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
                  4
                </kbd>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={view === "ai" ? "default" : "ghost"}
                  className={cn(
                    "rounded-lg px-3 sm:px-4",
                    view === "ai"
                      ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                      : "text-[#1A1F1E]"
                  )}
                  onClick={() => setView("ai")}
                >
                  <SparklesIcon className="mr-2 size-4 shrink-0" aria-hidden />
                  <span className="truncate">AI assistant</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Suggestions, schedule analysis, and chat (preview UI). Shortcut:{" "}
                <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
                  5
                </kbd>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
            {hasChanges ? (
              <Badge className="h-7 gap-1.5 rounded-lg border-amber-200 bg-amber-50 px-2.5 text-[10px] font-bold text-amber-700">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5 rounded-lg border-[#E8E6E0] font-bold text-[#1A1F1E]"
              onClick={() => setExportOpen(true)}
            >
              <PrinterIcon className="size-4" aria-hidden />
              Export
            </Button>
          </div>
        </div>
      </TooltipProvider>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent
          className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-lg"
          showCloseButton
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
            aria-hidden
          />
          <DialogHeader className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 pr-12 text-left sm:px-6">
            <div className="flex items-start gap-3">
              <PrinterIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
              <div className="min-w-0 space-y-1">
                <DialogTitle className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                  Export schedule
                </DialogTitle>
                <DialogDescription className="text-[13px] font-medium leading-relaxed text-[#6B7870]">
                  Plain-text summary for handoff or documentation. Use Print for a paper copy of
                  the whole page.
                </DialogDescription>
                <p className="text-[11px] font-bold text-[#1A5345]">{doctorName}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                Schedule summary
              </span>
              <div className="h-px flex-1 bg-[#E8E6E0]/60" aria-hidden />
            </div>
            <pre className="custom-scrollbar max-h-[min(50vh,360px)] overflow-auto rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4 font-mono text-[11px] leading-relaxed text-[#1A1F1E]">
              {exportText}
            </pre>
          </div>

          <DialogFooter className="gap-2 border-t border-[#E8E6E0]/60 bg-white px-5 py-4 sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-lg border-[#E8E6E0] text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50"
              onClick={() => window.print()}
            >
              <PrinterIcon className="mr-2 size-3.5" aria-hidden />
              Print page
            </Button>
            <Button
              type="button"
              className="h-9 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:bg-[#133F34]"
              onClick={() => void handleCopyExport()}
            >
              <CopyIcon className="mr-2 size-3.5" aria-hidden />
              Copy text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {view !== "ai" ? (
      <div className="grid animate-in fade-in duration-300 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
            <ClockIcon className="size-4 text-[#1A5345]" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Slot Duration
            </p>
            <p className="text-lg font-bold tabular-nums text-[#1A1F1E]">
              {draft.slotDurationMinutes}
              <span className="text-xs font-medium text-muted-foreground"> min</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF5F3]">
            <Table2Icon className="size-4 text-[#1A5345]" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Active Days
            </p>
            <p className="text-lg font-bold tabular-nums text-[#1A1F1E]">
              {draft.days.filter((d) => d.enabled).length}
              <span className="text-xs font-medium text-muted-foreground"> / 7</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <CheckIcon className="size-4 text-emerald-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Bookings
            </p>
            <p className="text-lg font-bold tabular-nums text-[#1A1F1E]">{bookingCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-3 shadow-sm transition-all hover:shadow-md">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
            <BanIcon className="size-4 text-amber-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Blocked
            </p>
            <p className="text-lg font-bold tabular-nums text-[#1A1F1E]">
              {draft.blockedDates.length}
            </p>
          </div>
        </div>
      </div>
      ) : null}

      {view === "ai" ? (
        <AssistantScheduleAiPanel
          doctorName={doctorName}
          schedule={draft}
          bookingCount={bookingCount}
          pausedCount={pausedCount}
          dayExtrasCount={bundle.dayExtras.length}
          onNavigate={(target) => setView(target)}
          onApplySuggestion={async (suggestionId) => {
            if (suggestionId === "buffer") {
              setDraft((prev) => ({
                ...prev,
                bufferBetweenSlotsMinutes: Math.max(prev.bufferBetweenSlotsMinutes, 10),
              }))
            }
          }}
          onSendMessage={(text, history) =>
            sendScheduleAiMessage(doctorId, doctorName, text, history)
          }
          onRunAnalysis={() => runScheduleAiAnalysis(doctorId, doctorName)}
        />
      ) : null}

      {view === "week" ? (
        <div className="space-y-4">
          <Card className="border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
              <CardTitle className="font-serif text-base text-[#1A1F1E]">Slot settings</CardTitle>
              <CardDescription>
                Same fields as the doctor portal; saved locally for now.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="slot-len" className="text-xs font-semibold">
                  Slot length (minutes)
                </Label>
                <Input
                  id="slot-len"
                  type="number"
                  min={5}
                  max={120}
                  className="h-10 w-32 rounded-xl"
                  value={draft.slotDurationMinutes}
                  onChange={(e) => handleNumeric("slotDurationMinutes", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="buffer" className="text-xs font-semibold">
                  Buffer between slots (minutes)
                </Label>
                <Input
                  id="buffer"
                  type="number"
                  min={0}
                  max={60}
                  className="h-10 w-32 rounded-xl"
                  value={draft.bufferBetweenSlotsMinutes}
                  onChange={(e) => handleNumeric("bufferBetweenSlotsMinutes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <ScheduleTable days={draft.days} onDayChange={handleDayChange} />
        </div>
      ) : null}

      {view === "blocked" ? (
        <div className="space-y-4">
          <Card className="border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
              <CardTitle className="font-serif text-base text-[#1A1F1E]">
                Blocked calendar dates
              </CardTitle>
              <CardDescription>
                Whole days marked unavailable (vacation, conference). Save the schedule to persist
                changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E8E6E0]/70 bg-[#FAFAF8] p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="blocked-date" className="text-xs font-semibold">
                    Date
                  </Label>
                  <Input
                    id="blocked-date"
                    type="date"
                    className="h-10 w-full min-w-[160px] rounded-xl sm:w-44"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                  />
                </div>
                <div className="min-w-[200px] flex-1 space-y-1.5">
                  <Label htmlFor="blocked-reason" className="text-xs font-semibold">
                    Reason (optional)
                  </Label>
                  <Input
                    id="blocked-reason"
                    className="h-10 rounded-xl"
                    placeholder="Conference, PTO…"
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="h-10 shrink-0 rounded-xl bg-[#1A5345] px-4 font-bold text-white hover:bg-[#133F34]"
                  onClick={handleAddBlockedDate}
                >
                  Add
                </Button>
              </div>
              {draft.blockedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocked dates yet.</p>
              ) : (
                <ul className="space-y-2">
                  {draft.blockedDates.map((bd) => (
                    <li
                      key={bd.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/80 bg-white px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="font-semibold text-[#1A1F1E]">{bd.date}</p>
                        {bd.reason ? (
                          <p className="text-xs text-muted-foreground">{bd.reason}</p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-[#E8E6E0] text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveBlockedDate(bd.id)}
                      >
                        <Trash2Icon className="mr-2 size-4" aria-hidden />
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {view === "calendar" ? (
        <div className="space-y-4">
          <div className="px-1 sm:px-0">
            <h2 className="font-serif text-[20px] font-bold tracking-tight text-[#102F27] sm:text-[22px]">
              Month overview
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] font-medium text-muted-foreground">
              Blocked dates from the Blocked dates tab are highlighted on this grid.
            </p>
          </div>
          <ScheduleMonthCalendar
            monthCursor={calendarMonth}
            onMonthChange={setCalendarMonth}
            blockedDates={draft.blockedDates}
          />
        </div>
      ) : null}

      {view === "day" ? (
        <Card className="border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <CardHeader className="border-b border-[#E8E6E0]/50 pb-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-serif text-base text-[#1A1F1E]">Sessions by day</CardTitle>
                <CardDescription className="mt-0.5">
                  Manage working periods, breaks, and upcoming bookings for the selected day.
                </CardDescription>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[11px] font-medium text-muted-foreground sm:mt-0">
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-sm bg-[#1A5345]" />
                  Working
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-sm bg-amber-100 border border-amber-300" />
                  Booking
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-sm bg-red-50 border border-red-200" />
                  Break
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block size-2.5 rounded-sm bg-[#CC5533]" />
                  Extra (date only)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <DailySessionsPanel
              days={draft.days}
              pausedPeriodIds={bundle.pausedPeriodIds}
              onTogglePause={(id) => togglePeriodPause(id)}
              onDayChange={handleDayChange}
              scheduleDraft={draft}
              bookings={bundle.bookings}
              onMoveBooking={(bookingId, startTime, endTime) =>
                moveBookingAsync({
                  bookingId,
                  startTime,
                  endTime,
                  schedule: draft,
                  bookings: bundle.bookings,
                })
              }
              isMovingBooking={isMovingBooking}
              onCancelBooking={cancelBooking}
              isCancellingBooking={isCancellingBooking}
              cancellingBookingId={cancellingBookingId}
              doctorArrivalByWeekday={bundle.doctorArrivalByWeekday}
              onSetDoctorArrival={(weekday, arrivalTime) =>
                setDoctorArrival({ weekday, arrivalTime })
              }
              isSettingArrival={isSettingArrival}
              dayExtras={bundle.dayExtras}
              onCreateDayExtra={createDayExtraAsync}
              isCreatingDayExtra={isCreatingDayExtra}
              onDeleteDayExtra={deleteDayExtra}
              isDeletingDayExtra={isDeletingDayExtra}
              deletingDayExtraId={deletingDayExtraId}
              disabled={isTogglingPause}
            />
          </CardContent>
        </Card>
      ) : null}

      {hasChanges ? (
        <div className="sticky bottom-0 z-30 -mx-6 border-t border-[#E8E6E0]/70 bg-white/95 px-6 py-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 sm:-mx-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-[13px] font-medium text-[#1A1F1E] sm:text-[14px]">
                Schedule has unsaved changes
              </p>
            </div>
            <Button
              type="button"
              className="rounded-xl bg-[#1A5345] px-6 font-bold text-white shadow-[0_4px_20px_-6px_rgba(26,83,69,0.3)] hover:bg-[#133F34]"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <SaveIcon className="mr-2 size-4" aria-hidden />
              )}
              Save schedule for {doctorName}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function AssistantDoctorScheduleClient() {
  const searchParams = useSearchParams()
  const doctorsQuery = useAssistantScheduleDoctors()
  const doctors = doctorsQuery.data ?? []

  const [doctorId, setDoctorId] = React.useState("")

  React.useEffect(() => {
    const fromQuery = searchParams.get("doctorId")?.trim()
    if (fromQuery && doctors.some((doctor) => doctor.id === fromQuery)) {
      setDoctorId(fromQuery)
      return
    }
    if (!doctorId && doctors.length > 0) {
      setDoctorId(doctors[0]!.id)
    }
  }, [doctorId, doctors, searchParams])

  const {
    bundle,
    isLoading,
    saveScheduleAsync,
    isSaving,
    togglePeriodPause,
    isTogglingPause,
    moveBookingAsync,
    isMovingBooking,
    cancelBooking,
    isCancellingBooking,
    cancellingBookingId,
    setDoctorArrival,
    isSettingArrival,
    createDayExtraAsync,
    isCreatingDayExtra,
    deleteDayExtra,
    isDeletingDayExtra,
    deletingDayExtraId,
  } = useAssistantDoctorSchedule(doctorId)

  const selectedDoctorName = doctors.find((d) => d.id === doctorId)?.name ?? "Doctor"

  const scheduleFingerprint = React.useMemo(
    () => (bundle ? JSON.stringify(bundle.schedule) : ""),
    [bundle]
  )

  const bodyKey = `${doctorId}__${scheduleFingerprint}`

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col animate-in fade-in duration-500">
      <header className="bg-transparent px-6 pb-3 pt-4 sm:px-8">
        <div className="space-y-0.5">
          <h1 className="font-serif text-[22px] font-bold tracking-tight text-[#102F27] sm:text-[26px]">
            Doctor schedule
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
            Review the weekly grid, adjust working periods, inspect each day&apos;s sessions, and
            pause a session when the doctor must step away. All changes are saved to the database.
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col space-y-6 px-6 pb-10 sm:px-8">
        <Card className="border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
          <CardHeader className="border-b border-[#E8E6E0]/50 pb-4">
            <CardTitle className="font-serif text-lg text-[#1A1F1E]">Select doctor</CardTitle>
            <CardDescription>Each doctor has their own weekly schedule in the database.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex max-w-md flex-col gap-2">
              <Label
                htmlFor="doctor-select"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Doctor
              </Label>
              <DoctorScheduleDoctorPicker
                doctors={doctors}
                doctorId={doctorId}
                onDoctorIdChange={setDoctorId}
              />
            </div>
          </CardContent>
        </Card>

        {doctorsQuery.isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E8E6E0]/70 bg-white">
            <Loader2Icon className="size-8 animate-spin text-[#1A5345]" aria-hidden />
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E8E6E0] bg-white px-6 py-12 text-center text-sm text-muted-foreground">
            No doctors found. Add doctor profiles in the admin panel first.
          </div>
        ) : isLoading || !bundle ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-[#E8E6E0]/70 bg-white">
            <Loader2Icon className="size-8 animate-spin text-[#1A5345]" aria-hidden />
          </div>
        ) : (
          <AssistantDoctorScheduleBody
            key={bodyKey}
            doctorId={doctorId}
            bundle={bundle}
            saveScheduleAsync={saveScheduleAsync}
            isSaving={isSaving}
            togglePeriodPause={togglePeriodPause}
            isTogglingPause={isTogglingPause}
            moveBookingAsync={moveBookingAsync}
            isMovingBooking={isMovingBooking}
            cancelBooking={cancelBooking}
            isCancellingBooking={isCancellingBooking}
            cancellingBookingId={cancellingBookingId}
            setDoctorArrival={setDoctorArrival}
            isSettingArrival={isSettingArrival}
            createDayExtraAsync={createDayExtraAsync}
            isCreatingDayExtra={isCreatingDayExtra}
            deleteDayExtra={deleteDayExtra}
            isDeletingDayExtra={isDeletingDayExtra}
            deletingDayExtraId={deletingDayExtraId}
            doctorName={selectedDoctorName}
          />
        )}
      </div>
    </div>
  )
}
