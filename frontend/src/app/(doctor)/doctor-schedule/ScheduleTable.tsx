"use client"

import { BriefcaseIcon, BanIcon, Trash2Icon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { DayAvailability, TimeBlock } from "./doctorSchedule.types"
import { createTimeBlock } from "./doctorSchedule.utils"

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
    onDayChange({
      ...day,
      periods: updateBlock(day.periods, id, { [field]: value })
    })
  }

  const handleBlockChange = (day: DayAvailability, id: string, field: "startTime" | "endTime", value: string) => {
    onDayChange({
      ...day,
      unavailableBlocks: updateBlock(day.unavailableBlocks, id, { [field]: value })
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
    if (day.periods.length <= 1) return
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
                      {day.periods.map((period) => (
                        <div key={period.id} className="flex items-center gap-1">
                          <BriefcaseIcon className="size-3 text-muted-foreground" />
                          <input
                            type="time"
                            className="h-7 w-24 rounded border border-input bg-background px-1 text-xs"
                            value={period.startTime}
                            onChange={(e) => handlePeriodChange(day, period.id, "startTime", e.target.value)}
                          />
                          <span className="text-xs text-muted-foreground">→</span>
                          <input
                            type="time"
                            className="h-7 w-24 rounded border border-input bg-background px-1 text-xs"
                            value={period.endTime}
                            onChange={(e) => handlePeriodChange(day, period.id, "endTime", e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            disabled={day.periods.length <= 1}
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
                            <input
                              type="time"
                              className="h-7 w-24 rounded border border-input bg-background px-1 text-xs"
                              value={block.startTime}
                              onChange={(e) => handleBlockChange(day, block.id, "startTime", e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground">→</span>
                            <input
                              type="time"
                              className="h-7 w-24 rounded border border-input bg-background px-1 text-xs"
                              value={block.endTime}
                              onChange={(e) => handleBlockChange(day, block.id, "endTime", e.target.value)}
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
