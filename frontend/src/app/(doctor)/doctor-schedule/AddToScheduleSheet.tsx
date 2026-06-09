"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { timeToMinutes } from "./doctorSchedule.schema"
import type { DayAvailability, WeekdayId } from "./doctorSchedule.types"

type EntryKind = "period" | "block"

type AddToScheduleSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  days: DayAvailability[]
  onAdd: (input: {
    weekday: WeekdayId
    kind: EntryKind
    startTime: string
    endTime: string
  }) => void
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

function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string
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
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Select value={hour} onValueChange={(v) => handleChange("hour", v)}>
          <SelectTrigger className="h-10 w-16 px-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {HOURS_12.map((h) => (
              <SelectItem key={h} value={h} className="text-sm">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm font-medium text-muted-foreground">:</span>

        <Select value={minute} onValueChange={(v) => handleChange("minute", v)}>
          <SelectTrigger className="h-10 w-16 px-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="text-sm">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => handleChange("period", v)}>
          <SelectTrigger className="h-10 w-18 px-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p} className="text-sm">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function AddToScheduleSheet({
  open,
  onOpenChange,
  days,
  onAdd,
}: AddToScheduleSheetProps) {
  const [weekday, setWeekday] = React.useState<WeekdayId>(days[0]?.weekday ?? "monday")
  const [kind, setKind] = React.useState<EntryKind>("block")
  const [startTime, setStartTime] = React.useState("12:00")
  const [endTime, setEndTime] = React.useState("13:00")

  React.useEffect(() => {
    if (open && days[0]) {
      setWeekday(days[0].weekday)
    }
  }, [open, days])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      toast.error("Invalid times", { description: "End must be after start." })
      return
    }
    onAdd({ weekday, kind, startTime, endTime })
    toast.success("Added to schedule", {
      description:
        kind === "block" ? "Blocked time added for that day." : "Working period added.",
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="center"
        showCloseButton
        className={cn(
          "max-h-[min(90vh,640px)] w-[calc(100%-1.5rem)] max-w-[440px] gap-0 overflow-y-auto rounded-2xl border border-border/70 bg-background p-0 shadow-2xl",
          "data-[side=center]:p-0"
        )}
      >
        <SheetHeader className="space-y-1.5 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/80 px-5 pb-4 pt-6 text-left">
          <SheetTitle className="font-sans text-[15px] sm:text-[16px] font-bold text-[#1A1F1E]">
            Add to schedule
          </SheetTitle>
          <SheetDescription className="text-left text-[11px] sm:text-[12px] text-muted-foreground">
            Quickly append a working period or a blocked break to one day. You can still edit
            everything in the section below.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-5 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="add-day" className="text-[11px] sm:text-[12px] font-semibold text-[#1A1F1E]">
                Day
              </Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v as WeekdayId)}>
                <SelectTrigger
                  id="add-day"
                  className="h-10 rounded-lg border-[#E8E6E0] text-[12px] font-medium shadow-sm focus:ring-[#1A5345]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d.weekday} value={d.weekday} className="text-[12px]">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-type" className="text-[11px] sm:text-[12px] font-semibold text-[#1A1F1E]">
                Type
              </Label>
              <Select value={kind} onValueChange={(v) => setKind(v as EntryKind)}>
                <SelectTrigger
                  id="add-type"
                  className="h-10 rounded-lg border-[#E8E6E0] text-[12px] font-medium shadow-sm focus:ring-[#1A5345]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block" className="text-[12px]">Blocked time (break / admin)</SelectItem>
                  <SelectItem value="period" className="text-[12px]">Working period</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimePicker label="From" value={startTime} onChange={setStartTime} />
              <TimePicker label="To" value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-3 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/80 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 min-w-[100px] rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold text-[#1A1F1E] hover:bg-[#F9F8F5] shadow-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 min-w-[100px] rounded-lg bg-[#1A5345] text-[12px] font-semibold text-white shadow-sm hover:bg-[#0F3D32]"
            >
              Add
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
