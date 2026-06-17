"use client"

import * as React from "react"
import { BriefcaseIcon, BanIcon, CopyIcon, Trash2Icon, PlusIcon } from "lucide-react"
import { useLocale } from "next-intl"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { CopyDayScheduleDialog } from "./CopyDayScheduleDialog"
import type { DayAvailability, TimeBlock, WeekdayId } from "./doctorSchedule.types"
import { createTimeBlock } from "./doctorSchedule.utils"

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = ["00", "15", "30", "45"]
const PERIODS = ["AM", "PM"] as const

function parseTime24(time24: string) {
  const [h, m] = time24.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(m).padStart(2, "0"),
    period,
  }
}

function formatTime24(hour12: string, minute: string, period: "AM" | "PM") {
  let h = Number(hour12)
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return `${String(h).padStart(2, "0")}:${minute}`
}

function TimePickerCompact({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { hour, minute, period } = parseTime24(value)

  const handleChange = (field: "hour" | "minute" | "period", newValue: string) => {
    const newHour = field === "hour" ? newValue : hour
    const newMinute = field === "minute" ? newValue : minute
    const newPeriod = field === "period" ? newValue : period
    onChange(formatTime24(newHour, newMinute, newPeriod as "AM" | "PM"))
  }

  return (
    <div className="flex items-center gap-0.5">
      <Select value={hour} onValueChange={(v) => handleChange("hour", v)}>
        <SelectTrigger hideIcon className="h-7 w-12 px-1.5 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-40">
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={h} className="text-xs">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground">:</span>

      <Select value={minute} onValueChange={(v) => handleChange("minute", v)}>
        <SelectTrigger hideIcon className="h-7 w-12 px-1.5 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-40">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m} className="text-xs">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(v) => handleChange("period", v)}>
        <SelectTrigger hideIcon className="h-7 w-12 px-1.5 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type ScheduleTableProps = {
  days: DayAvailability[]
  onDayChange: (day: DayAvailability) => void
  onCopyDaySchedule?: (sourceWeekday: WeekdayId, targetWeekdays: WeekdayId[]) => void
  labels?: Partial<{
    title: string
    subtitle: string
    legendWorking: string
    legendBreak: string
    colDay: string
    colStatus: string
    colMaxVisits: string
    colWorkingPeriods: string
    colBlockedTimes: string
    open: string
    off: string
    noPeriods: string
    noBlocks: string
    addPeriod: string
    addBlock: string
    removePeriod: string
    removeBlock: string
    to: string
    copyDay: string
    copyDayTitle: string
    copyDayDescription: string
    copyDaySelectAll: string
    copyDayClearAll: string
    copyDayConfirm: string
    copyDayCancel: string
    copyDayNoTargets: string
    copyDaySuccessTitle: string
    copyDaySuccessDescription: string
  }>
}

function updateBlock(
  blocks: TimeBlock[],
  id: string,
  patch: Partial<Pick<TimeBlock, "startTime" | "endTime">>
): TimeBlock[] {
  return blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
}

function removeBlock(blocks: TimeBlock[], id: string): TimeBlock[] {
  return blocks.filter((b) => b.id !== id)
}

function DayTimeline({ periods, blocks }: { periods: TimeBlock[], blocks: TimeBlock[] }) {
  const totalMins = 24 * 60; // 1440
  
  return (
    <div className="w-full select-none pt-2 pb-1">
      {/* Timeline Bar */}
      <div className="relative h-8 w-full rounded-xl bg-[#F4F3ED] border border-[#E8E6E0] overflow-hidden shadow-inner">
        {/* Grid lines */}
        {[4, 8, 12, 16, 20].map(h => (
          <div key={h} className="absolute top-0 bottom-0 border-l border-[#E8E6E0] z-0" style={{ left: `${(h / 24) * 100}%` }} />
        ))}
        
        {/* Working Periods */}
        {periods.map(p => {
           const start = timeToMinutes(p.startTime);
           const end = timeToMinutes(p.endTime);
           if (start >= end) return null;
           const left = (start / totalMins) * 100;
           const width = ((end - start) / totalMins) * 100;
           return (
             <div 
               key={p.id} 
               className="absolute top-1 bottom-1 bg-[#1A5345] rounded-md z-10 flex flex-col items-center justify-center overflow-hidden shadow-sm border border-[#133F34]"
               style={{ left: `${left}%`, width: `${width}%` }}
               title={`Working: ${p.startTime} - ${p.endTime}`}
             >
                {width > 8 && (
                   <span className="text-[10px] font-bold text-white whitespace-nowrap px-1">
                     {p.startTime} - {p.endTime}
                   </span>
                )}
             </div>
           )
        })}
        
        {/* Blocked Times (Breaks) */}
        {blocks.map(b => {
           const start = timeToMinutes(b.startTime);
           const end = timeToMinutes(b.endTime);
           if (start >= end) return null;
           const left = (start / totalMins) * 100;
           const width = ((end - start) / totalMins) * 100;
           return (
             <div 
               key={b.id} 
               className="absolute top-1 bottom-1 bg-red-50 rounded-md border border-red-200 z-20 flex flex-col items-center justify-center overflow-hidden shadow-sm"
               style={{ left: `${left}%`, width: `${width}%` }}
               title={`Break: ${b.startTime} - ${b.endTime}`}
             >
                <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#fca5a5_4px,#fca5a5_8px)]" />
                {width > 6 && (
                   <span className="text-[10px] font-bold text-red-700 relative z-10 whitespace-nowrap px-1 bg-white/80 rounded-sm">
                     Break
                   </span>
                )}
             </div>
           )
        })}
      </div>
      
      {/* Time Labels */}
      <div className="relative w-full h-4 mt-1.5">
        <span className="absolute left-0 text-[10px] font-medium text-muted-foreground">12 AM</span>
        <span className="absolute left-[16.66%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">4 AM</span>
        <span className="absolute left-[33.33%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">8 AM</span>
        <span className="absolute left-[50%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">12 PM</span>
        <span className="absolute left-[66.66%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">4 PM</span>
        <span className="absolute left-[83.33%] -translate-x-1/2 text-[10px] font-medium text-muted-foreground">8 PM</span>
        <span className="absolute right-0 text-[10px] font-medium text-muted-foreground">11:59 PM</span>
      </div>
    </div>
  )
}

export function ScheduleTable({ days, onDayChange, onCopyDaySchedule, labels }: ScheduleTableProps) {
  const locale = useLocale()
  const [copySource, setCopySource] = React.useState<DayAvailability | null>(null)
  const t = {
    title: labels?.title ?? "Schedule details",
    subtitle: labels?.subtitle ?? "Manage working periods and blocked times for each day",
    legendWorking: labels?.legendWorking ?? "Working",
    legendBreak: labels?.legendBreak ?? "Break",
    colDay: labels?.colDay ?? "Day",
    colStatus: labels?.colStatus ?? "Status",
    colMaxVisits: labels?.colMaxVisits ?? "Max Visits",
    colWorkingPeriods: labels?.colWorkingPeriods ?? "Working Periods",
    colBlockedTimes: labels?.colBlockedTimes ?? "Blocked Times",
    open: labels?.open ?? "Open",
    off: labels?.off ?? "Off",
    noPeriods: labels?.noPeriods ?? "No periods",
    noBlocks: labels?.noBlocks ?? "No blocks",
    addPeriod: labels?.addPeriod ?? "Add period",
    addBlock: labels?.addBlock ?? "Add block",
    removePeriod: labels?.removePeriod ?? "Remove period",
    removeBlock: labels?.removeBlock ?? "Remove block",
    to: labels?.to ?? "to",
    copyDay: labels?.copyDay ?? "Copy to other days",
    copyDayTitle: labels?.copyDayTitle ?? "Copy day schedule",
    copyDayDescription:
      labels?.copyDayDescription ??
      "Copy {day}'s working periods, breaks, and settings to other days.",
    copyDaySelectAll: labels?.copyDaySelectAll ?? "Select all",
    copyDayClearAll: labels?.copyDayClearAll ?? "Clear all",
    copyDayConfirm: labels?.copyDayConfirm ?? "Copy schedule",
    copyDayCancel: labels?.copyDayCancel ?? "Cancel",
    copyDayNoTargets: labels?.copyDayNoTargets ?? "Select at least one day.",
    copyDaySuccessTitle: labels?.copyDaySuccessTitle ?? "Schedule copied",
    copyDaySuccessDescription:
      labels?.copyDaySuccessDescription ?? "Selected days now match this day's schedule.",
  }

  const localizedWeekday = (day: DayAvailability) => {
    const idxMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }
    const idx = idxMap[day.weekday]
    if (idx === undefined) return day.label
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2024, 0, 7 + idx))
  }
  const handleToggleDay = (day: DayAvailability) => {
    onDayChange({ ...day, enabled: !day.enabled })
  }

  const handleMaxChange = (day: DayAvailability, value: string) => {
    if (value === "") {
      onDayChange({ ...day, maxAppointmentsPerDay: null })
      return
    }
    const n = Number(value)
    if (!Number.isFinite(n)) return
    onDayChange({ ...day, maxAppointmentsPerDay: n })
  }

  const handlePeriodChange = (day: DayAvailability, id: string, field: "startTime" | "endTime", value: string) => {
    const period = day.periods.find((p) => p.id === id)
    if (!period) return

    const newStart = field === "startTime" ? value : period.startTime
    const newEnd = field === "endTime" ? value : period.endTime

    // Auto-fix: if end <= start, adjust the other field
    let fixedStart = newStart
    let fixedEnd = newEnd
    if (timeToMinutes(newEnd) <= timeToMinutes(newStart)) {
      if (field === "endTime") {
        // User changed end to be before start, push end to start + 30 min
        const startMins = timeToMinutes(newStart)
        const newEndMins = startMins + 30
        const h = Math.floor(newEndMins / 60)
        const m = newEndMins % 60
        fixedEnd = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      } else {
        // User changed start to be after end, pull start to end - 30 min
        const endMins = timeToMinutes(newEnd)
        const newStartMins = Math.max(0, endMins - 30)
        const h = Math.floor(newStartMins / 60)
        const m = newStartMins % 60
        fixedStart = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      }
    }

    onDayChange({
      ...day,
      periods: updateBlock(day.periods, id, { startTime: fixedStart, endTime: fixedEnd })
    })
  }

  const handleBlockChange = (day: DayAvailability, id: string, field: "startTime" | "endTime", value: string) => {
    const block = day.unavailableBlocks.find((b) => b.id === id)
    if (!block) return

    const newStart = field === "startTime" ? value : block.startTime
    const newEnd = field === "endTime" ? value : block.endTime

    // Auto-fix: if end <= start, adjust the other field
    let fixedStart = newStart
    let fixedEnd = newEnd
    if (timeToMinutes(newEnd) <= timeToMinutes(newStart)) {
      if (field === "endTime") {
        // User changed end to be before start, push end to start + 30 min
        const startMins = timeToMinutes(newStart)
        const newEndMins = startMins + 30
        const h = Math.floor(newEndMins / 60)
        const m = newEndMins % 60
        fixedEnd = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      } else {
        // User changed start to be after end, pull start to end - 30 min
        const endMins = timeToMinutes(newEnd)
        const newStartMins = Math.max(0, endMins - 30)
        const h = Math.floor(newStartMins / 60)
        const m = newStartMins % 60
        fixedStart = `${String(String(h).padStart(2, "0"))}:${String(m).padStart(2, "0")}`
      }
    }

    onDayChange({
      ...day,
      unavailableBlocks: updateBlock(day.unavailableBlocks, id, { startTime: fixedStart, endTime: fixedEnd })
    })
  }

  const addPeriod = (day: DayAvailability) => {
    const last = day.periods[day.periods.length - 1]
    const start = last?.endTime ?? "14:00"
    const [h] = start.split(":").map(Number)
    const endH = Math.min(h + 2, 18)
    const end = `${String(endH).padStart(2, "0")}:00`
    onDayChange({ ...day, periods: [...day.periods, createTimeBlock(start, end)] })
  }

  const removePeriod = (day: DayAvailability, id: string) => {
    onDayChange({ ...day, periods: removeBlock(day.periods, id) })
  }

  const addBlock = (day: DayAvailability) => {
    onDayChange({
      ...day,
      unavailableBlocks: [...day.unavailableBlocks, createTimeBlock("12:00", "13:00")]
    })
  }

  const removeBlockItem = (day: DayAvailability, id: string) => {
    onDayChange({ ...day, unavailableBlocks: removeBlock(day.unavailableBlocks, id) })
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] animate-in fade-in duration-500">
      <div className="border-b border-[#E8E6E0]/50 bg-[#FAFAF8]/80 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] sm:text-[17px]">{t.title}</h2>
            <p className="text-[13px] font-medium text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-[#1A5345]" />
              {t.legendWorking}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm border border-red-200 bg-red-50" />
              {t.legendBreak}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/40 text-left text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
              <th className="px-4 sm:px-5 py-3 w-[140px]">{t.colDay}</th>
              <th className="px-4 sm:px-5 py-3 w-[140px]">{t.colStatus}</th>
              <th className="px-4 sm:px-5 py-3 w-[140px]">{t.colMaxVisits}</th>
              <th className="px-4 sm:px-5 py-3">{t.colWorkingPeriods}</th>
              <th className="px-4 sm:px-5 py-3">{t.colBlockedTimes}</th>
            </tr>
          </thead>
            {days.map((day) => (
              <tbody key={day.weekday} className="border-b border-[#E8E6E0]/40 last:border-0">
                {day.enabled && (
                  <tr className="bg-white">
                    <td colSpan={5} className="px-5 pt-5 pb-2">
                      <DayTimeline periods={day.periods} blocks={day.unavailableBlocks} />
                    </td>
                  </tr>
                )}
                <tr
                  className={cn(
                    "transition-colors hover:bg-muted/10",
                    day.enabled ? "bg-white" : "bg-[#F9F8F5]/40"
                  )}
                >
                <td className="px-4 sm:px-5 py-3 sm:py-4 text-[12px] sm:text-[13px] font-medium text-[#1A1F1E]">
                  <div className="flex items-center gap-1.5">
                    <span>{localizedWeekday(day)}</span>
                    {onCopyDaySchedule ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
                        title={t.copyDay}
                        onClick={() => setCopySource(day)}
                      >
                        <CopyIcon className="size-3.5" aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 sm:px-5 py-3 sm:py-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`enable-${day.weekday}`}
                      checked={day.enabled}
                      onCheckedChange={() => handleToggleDay(day)}
                      className="border-[#1A5345] data-[state=checked]:bg-[#1A5345] data-[state=checked]:text-white"
                    />
                    <Label
                      htmlFor={`enable-${day.weekday}`}
                      className={cn(
                        "cursor-pointer text-[11px] sm:text-[12px] font-medium",
                        day.enabled ? "text-[#1A5345]" : "text-muted-foreground"
                      )}
                    >
                      {day.enabled ? t.open : t.off}
                    </Label>
                  </div>
                </td>
                <td className="px-4 sm:px-5 py-3 sm:py-4">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    placeholder="—"
                    className="h-8 w-20 text-[11px] sm:text-[12px] bg-background border-[#E8E6E0] focus-visible:ring-[#1A5345]"
                    disabled={!day.enabled}
                    value={day.maxAppointmentsPerDay ?? ""}
                    onChange={(e) => handleMaxChange(day, e.target.value)}
                  />
                </td>
                <td className="px-4 sm:px-5 py-3 sm:py-4">
                  {day.enabled ? (
                    <div className="space-y-2.5">
                      {day.periods.length === 0 && (
                        <span className="text-[11px] sm:text-[12px] text-muted-foreground italic">{t.noPeriods}</span>
                      )}
                      {day.periods.map((period) => (
                        <div key={period.id} className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1.5 rounded-md border border-[#E8E6E0]/80 bg-[#F9F8F5]/50 px-2 py-1 shadow-sm">
                            <BriefcaseIcon className="size-3.5 text-[#1A5345]/70" />
                            <TimePickerCompact
                              value={period.startTime}
                              onChange={(v) => handlePeriodChange(day, period.id, "startTime", v)}
                            />
                            <span className="text-[10px] text-muted-foreground font-medium">{t.to}</span>
                            <TimePickerCompact
                              value={period.endTime}
                              onChange={(v) => handlePeriodChange(day, period.id, "endTime", v)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                            onClick={() => removePeriod(day, period.id)}
                            title={t.removePeriod}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-[11px] text-[#1A5345] hover:bg-[#1A5345]/10 hover:text-[#1A5345]"
                        onClick={() => addPeriod(day)}
                      >
                        <PlusIcon className="size-3.5" />
                        {t.addPeriod}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11px] sm:text-[12px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 sm:px-5 py-3 sm:py-4">
                  {day.enabled ? (
                    <div className="space-y-2.5">
                      {day.unavailableBlocks.length === 0 ? (
                        <span className="text-[11px] sm:text-[12px] text-muted-foreground italic">{t.noBlocks}</span>
                      ) : (
                        day.unavailableBlocks.map((block) => (
                          <div key={block.id} className="flex flex-wrap items-center gap-1.5">
                            <div className="flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50/50 px-2 py-1 shadow-sm">
                              <BanIcon className="size-3.5 text-red-500/80" />
                              <TimePickerCompact
                                value={block.startTime}
                                onChange={(v) => handleBlockChange(day, block.id, "startTime", v)}
                              />
                              <span className="text-[10px] text-muted-foreground font-medium">{t.to}</span>
                              <TimePickerCompact
                                value={block.endTime}
                                onChange={(v) => handleBlockChange(day, block.id, "endTime", v)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                              onClick={() => removeBlockItem(day, block.id)}
                              title={t.removeBlock}
                            >
                              <Trash2Icon className="size-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-2 text-[11px] text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                        onClick={() => addBlock(day)}
                      >
                        <PlusIcon className="size-3.5" />
                        {t.addBlock}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11px] sm:text-[12px] text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            </tbody>
            ))}
        </table>
      </div>

      {copySource && onCopyDaySchedule ? (
        <CopyDayScheduleDialog
          open={Boolean(copySource)}
          onOpenChange={(open) => {
            if (!open) setCopySource(null)
          }}
          sourceDay={copySource}
          allDays={days}
          onCopy={(targetWeekdays) => onCopyDaySchedule(copySource.weekday, targetWeekdays)}
          labels={{
            title: t.copyDayTitle,
            description: t.copyDayDescription,
            selectAll: t.copyDaySelectAll,
            clearAll: t.copyDayClearAll,
            copy: t.copyDayConfirm,
            cancel: t.copyDayCancel,
            noTargetsSelected: t.copyDayNoTargets,
            successTitle: t.copyDaySuccessTitle,
            successDescription: t.copyDaySuccessDescription,
          }}
        />
      ) : null}
    </section>
  )
}
