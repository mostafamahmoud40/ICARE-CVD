"use client"

import { ClockIcon, HourglassIcon, UsersIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { DayAvailability, DoctorSchedulePayload } from "./doctorSchedule.types"

const SLOT_OPTIONS = [15, 20, 30, 45, 60] as const
const BUFFER_OPTIONS = [0, 5, 10, 15, 20] as const
const DAY_START = 8 // 8 AM
const DAY_END = 20 // 8 PM
const TOTAL_HOURS = DAY_END - DAY_START

type WeeklyScheduleOverviewProps = {
  schedule: DoctorSchedulePayload
  onSlotDurationMinutesChange: (minutes: number) => void
  onBufferMinutesChange?: (minutes: number) => void
}

export function WeeklyScheduleOverview({
  schedule,
  onSlotDurationMinutesChange,
  onBufferMinutesChange,
}: WeeklyScheduleOverviewProps) {
  return (
    <section
      aria-label="Your weekly schedule overview"
      className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#E8E6E0]/50 bg-[#FAFAF8]/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-0.5">
          <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] sm:text-[17px]">Weekly overview</h2>
          <p className="text-[13px] font-medium text-muted-foreground">
            Visual timeline of your working hours and breaks
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 self-start rounded-xl border border-[#E8E6E0] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1A1F1E] shadow-sm sm:self-auto">
            <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="shrink-0 text-muted-foreground">Slot</span>
            <Select
              value={String(schedule.slotDurationMinutes)}
              onValueChange={(v) => onSlotDurationMinutesChange(Number(v))}
            >
              <SelectTrigger
                aria-label="Appointment slot length in minutes"
                className="h-7 w-[76px] shrink-0 justify-center gap-0 rounded-lg border-0 bg-[#E8F0EE]/50 px-2 text-[11px] font-bold text-[#1A5345] shadow-none ring-0 hover:bg-[#E8F0EE] focus:ring-2 focus:ring-[#1A5345]/20 data-[size=default]:h-7 [&_svg]:hidden"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SLOT_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 self-start rounded-xl border border-[#E8E6E0] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1A1F1E] shadow-sm sm:self-auto">
            <HourglassIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="shrink-0 text-muted-foreground">Buffer</span>
            <Select
              value={String(schedule.bufferBetweenSlotsMinutes ?? 10)}
              onValueChange={(v) => onBufferMinutesChange?.(Number(v))}
            >
              <SelectTrigger
                aria-label="Buffer time between slots"
                className="h-7 w-[76px] shrink-0 justify-center gap-0 rounded-lg border-0 bg-amber-50 px-2 text-[11px] font-bold text-amber-700 shadow-none ring-0 hover:bg-amber-100 focus:ring-2 focus:ring-amber-500/20 data-[size=default]:h-7 [&_svg]:hidden"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {BUFFER_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <TimelineHeader />
        <div className="divide-y divide-[#E8E6E0]/60">
          {schedule.days.map((day) => (
            <DayTimelineRow key={day.weekday} day={day} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineHeader() {
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => DAY_START + i)

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM"
    const displayHour = hour > 12 ? hour - 12 : hour
    return `${displayHour} ${period}`
  }

  return (
    <div className="mb-2 ml-[80px] sm:ml-[96px] flex items-end justify-between text-[10px] font-medium text-muted-foreground">
      {hours.map((hour, i) => (
        <div key={hour} className="flex flex-col items-center">
          <span>{formatHour(hour)}</span>
          {i < hours.length - 1 && <span className="h-2 w-px bg-[#E8E6E0]" />}
        </div>
      ))}
    </div>
  )
}

function DayTimelineRow({ day }: { day: DayAvailability }) {
  const active = day.enabled

  const timeToPercent = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const totalMinutes = (h - DAY_START) * 60 + m
    return (totalMinutes / (TOTAL_HOURS * 60)) * 100
  }

  return (
    <div className="group flex items-center gap-2 sm:gap-4 py-3">
      <div className="w-[80px] sm:w-[96px] shrink-0 pr-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={cn(
            "text-[11px] sm:text-[12px] font-semibold",
            active ? "text-[#1A1F1E]" : "text-muted-foreground"
          )}>
            {day.label.slice(0, 3)}
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-semibold uppercase",
              active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {active ? "Open" : "Off"}
          </span>
        </div>
        {active && day.maxAppointmentsPerDay && (
          <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
            <UsersIcon className="size-3" />
            <span>{day.maxAppointmentsPerDay} max</span>
          </div>
        )}
      </div>

      <div className="relative flex-1">
        <div className="relative h-10 rounded-xl bg-[#F4F3ED] ring-1 ring-inset ring-[#E8E6E0]/60">
          {active ? (
            <>
              {day.periods.map((period) => {
                const startPct = timeToPercent(period.startTime)
                const endPct = timeToPercent(period.endTime)
                const width = endPct - startPct

                return (
                  <div
                    key={period.id}
                    className="absolute top-0 bottom-0 rounded-md sm:rounded-lg bg-[#1A5345] shadow-sm opacity-80 hover:opacity-100 transition-opacity"
                    style={{
                      left: `${startPct}%`,
                      width: `${width}%`,
                    }}
                    title={`${period.startTime} – ${period.endTime}`}
                  />
                )
              })}
              {day.unavailableBlocks.map((block) => {
                const startPct = timeToPercent(block.startTime)
                const endPct = timeToPercent(block.endTime)
                const width = endPct - startPct

                return (
                  <div
                    key={block.id}
                    className="absolute top-0 bottom-0 z-10 rounded-md sm:rounded-lg bg-amber-500 shadow-sm"
                    style={{
                      left: `${startPct}%`,
                      width: `${width}%`,
                    }}
                    title={`Blocked: ${block.startTime} – ${block.endTime}`}
                  >
                    <div className="h-full w-full animate-[pulse_3s_ease-in-out_infinite] bg-amber-600/30 rounded-md sm:rounded-lg" />
                  </div>
                )
              })}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] sm:text-[11px] text-muted-foreground italic">No hours</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
