"use client"

import { BriefcaseIcon, BanIcon, Trash2Icon, PlusIcon } from "lucide-react"

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

import type { DayAvailability, TimeBlock } from "./doctorSchedule.types"
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

export function ScheduleTable({ days, onDayChange }: ScheduleTableProps) {
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
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
        <h2 className="text-base font-semibold">Schedule Details</h2>
        <p className="text-sm text-muted-foreground">Manage working periods and blocked times</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/20 text-left">
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Max Visits</th>
              <th className="px-4 py-3 font-medium">Working Periods</th>
              <th className="px-4 py-3 font-medium">Blocked Times</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {days.map((day) => (
              <tr
                key={day.weekday}
                className={cn(
                  "transition-colors",
                  day.enabled ? "bg-background" : "bg-muted/20"
                )}
              >
                <td className="px-4 py-3 font-medium">{day.label}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`enable-${day.weekday}`}
                      checked={day.enabled}
                      onCheckedChange={() => handleToggleDay(day)}
                    />
                    <Label
                      htmlFor={`enable-${day.weekday}`}
                      className={cn(
                        "cursor-pointer text-xs font-medium",
                        day.enabled ? "text-emerald-600" : "text-muted-foreground"
                      )}
                    >
                      {day.enabled ? "Open" : "Off"}
                    </Label>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    placeholder="—"
                    className="h-8 w-20 text-xs"
                    disabled={!day.enabled}
                    value={day.maxAppointmentsPerDay ?? ""}
                    onChange={(e) => handleMaxChange(day, e.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  {day.enabled ? (
                    <div className="space-y-2">
                      {day.periods.length === 0 && (
                        <span className="text-xs text-muted-foreground">No periods</span>
                      )}
                      {day.periods.map((period) => (
                        <div key={period.id} className="flex items-center gap-1">
                          <BriefcaseIcon className="size-3 text-muted-foreground" />
                          <TimePickerCompact
                            value={period.startTime}
                            onChange={(v) => handlePeriodChange(day, period.id, "startTime", v)}
                          />
                          <span className="text-xs text-muted-foreground">→</span>
                          <TimePickerCompact
                            value={period.endTime}
                            onChange={(v) => handlePeriodChange(day, period.id, "endTime", v)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removePeriod(day, period.id)}
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1 text-xs"
                        onClick={() => addPeriod(day)}
                      >
                        <PlusIcon className="size-3" />
                        Add period
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {day.enabled ? (
                    <div className="space-y-2">
                      {day.unavailableBlocks.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No blocks</span>
                      ) : (
                        day.unavailableBlocks.map((block) => (
                          <div key={block.id} className="flex items-center gap-1">
                            <BanIcon className="size-3 text-amber-500" />
                            <TimePickerCompact
                              value={block.startTime}
                              onChange={(v) => handleBlockChange(day, block.id, "startTime", v)}
                            />
                            <span className="text-xs text-muted-foreground">→</span>
                            <TimePickerCompact
                              value={block.endTime}
                              onChange={(v) => handleBlockChange(day, block.id, "endTime", v)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeBlockItem(day, block.id)}
                            >
                              <Trash2Icon className="size-3" />
                            </Button>
                          </div>
                        ))
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-1 text-xs"
                        onClick={() => addBlock(day)}
                      >
                        <PlusIcon className="size-3" />
                        Add block
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
