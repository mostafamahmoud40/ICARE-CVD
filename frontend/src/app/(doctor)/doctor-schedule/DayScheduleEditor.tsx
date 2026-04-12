"use client"

import { BanIcon, BriefcaseIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { DayAvailability, TimeBlock } from "./doctorSchedule.types"
import { createTimeBlock } from "./doctorSchedule.utils"

type DayScheduleEditorProps = {
  day: DayAvailability
  onChange: (next: DayAvailability) => void
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

export function DayScheduleEditor({ day, onChange }: DayScheduleEditorProps) {
  const setPeriods = (periods: TimeBlock[]) => onChange({ ...day, periods })
  const setBlocks = (unavailableBlocks: TimeBlock[]) =>
    onChange({ ...day, unavailableBlocks })

  return (
    <div className="space-y-4 rounded-lg border border-border/80 bg-card/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`day-${day.weekday}`}
            checked={day.enabled}
            onCheckedChange={(v) => onChange({ ...day, enabled: v === true })}
          />
          <Label htmlFor={`day-${day.weekday}`} className="cursor-pointer text-base font-semibold">
            {day.label}
          </Label>
        </div>

        <div className="flex flex-wrap items-end gap-2 sm:ml-auto">
          <div className="flex flex-col gap-1">
            <Label htmlFor={`max-appt-${day.weekday}`} className="text-xs text-muted-foreground">
              Max visits (optional)
            </Label>
            <Input
              id={`max-appt-${day.weekday}`}
              type="number"
              min={1}
              max={200}
              placeholder="No limit"
              className="h-9 w-[140px]"
              disabled={!day.enabled}
              value={day.maxAppointmentsPerDay ?? ""}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === "") {
                  onChange({ ...day, maxAppointmentsPerDay: null })
                  return
                }
                const n = Number(raw)
                if (!Number.isFinite(n)) return
                onChange({ ...day, maxAppointmentsPerDay: n })
              }}
            />
          </div>
        </div>
      </div>

      {day.enabled ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BriefcaseIcon className="size-4 text-muted-foreground" aria-hidden />
              Working periods
            </div>
            <p className="text-xs text-muted-foreground">
              Add multiple shifts (e.g. morning and afternoon). They cannot overlap.
            </p>
            <ul className="space-y-2">
              {day.periods.map((period) => (
                <li
                  key={period.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-background/80 p-2"
                >
                  <span className="text-xs text-muted-foreground">From</span>
                  <input
                    type="time"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    value={period.startTime}
                    onChange={(e) =>
                      setPeriods(
                        updateBlock(day.periods, period.id, {
                          startTime: e.target.value,
                        })
                      )
                    }
                    aria-label={`${day.label} period start`}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    value={period.endTime}
                    onChange={(e) =>
                      setPeriods(
                        updateBlock(day.periods, period.id, {
                          endTime: e.target.value,
                        })
                      )
                    }
                    aria-label={`${day.label} period end`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={day.periods.length <= 1}
                    aria-label="Remove period"
                    onClick={() => {
                      if (day.periods.length <= 1) return
                      setPeriods(removeBlock(day.periods, period.id))
                    }}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                const last = day.periods[day.periods.length - 1]
                const start = last?.endTime ?? "14:00"
                const [h] = start.split(":").map(Number)
                const endH = Math.min(h + 2, 18)
                const end = `${String(endH).padStart(2, "0")}:00`
                setPeriods([...day.periods, createTimeBlock(start, end)])
              }}
            >
              <PlusIcon className="size-4" />
              Add period
            </Button>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BanIcon className="size-4 text-muted-foreground" aria-hidden />
              Blocked times (breaks / admin)
            </div>
            <p className="text-xs text-muted-foreground">
              Times you are not taking bookings (lunch, meetings). Remove a row to cancel that
              block.
            </p>
            {day.unavailableBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No blocks — full day inside periods.</p>
            ) : (
              <ul className="space-y-2">
                {day.unavailableBlocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 p-2"
                  >
                    <span className="text-xs text-muted-foreground">Block</span>
                    <input
                      type="time"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      value={block.startTime}
                      onChange={(e) =>
                        setBlocks(
                          updateBlock(day.unavailableBlocks, block.id, {
                            startTime: e.target.value,
                          })
                        )
                      }
                      aria-label={`${day.label} block start`}
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="time"
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                      value={block.endTime}
                      onChange={(e) =>
                        setBlocks(
                          updateBlock(day.unavailableBlocks, block.id, {
                            endTime: e.target.value,
                          })
                        )
                      }
                      aria-label={`${day.label} block end`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove block"
                      onClick={() => setBlocks(removeBlock(day.unavailableBlocks, block.id))}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                setBlocks([
                  ...day.unavailableBlocks,
                  createTimeBlock("12:00", "13:00"),
                ])
              }}
            >
              <PlusIcon className="size-4" />
              Add block
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Day off — enable to edit periods and blocks.</p>
      )}
    </div>
  )
}
