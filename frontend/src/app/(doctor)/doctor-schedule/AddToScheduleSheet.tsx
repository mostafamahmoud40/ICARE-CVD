"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

const fieldSelectClassName =
  "h-11 w-full rounded-xl border-[#E8E6E0] bg-white text-[13px] font-medium shadow-sm focus:ring-[#1A5345]/20"

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
      <Label className="text-[13px] font-bold text-[#1A1F1E]">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Select value={hour} onValueChange={(v) => handleChange("hour", v)}>
          <SelectTrigger className={cn(fieldSelectClassName, "h-10 w-[4.25rem] px-2")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-48 rounded-xl border-[#E8E6E0]/60">
            {HOURS_12.map((h) => (
              <SelectItem key={h} value={h} className="text-[13px]">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-[13px] font-medium text-muted-foreground">:</span>

        <Select value={minute} onValueChange={(v) => handleChange("minute", v)}>
          <SelectTrigger className={cn(fieldSelectClassName, "h-10 w-[4.25rem] px-2")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-48 rounded-xl border-[#E8E6E0]/60">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="text-[13px]">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => handleChange("period", v)}>
          <SelectTrigger className={cn(fieldSelectClassName, "h-10 w-[4.5rem] px-2")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[#E8E6E0]/60">
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p} className="text-[13px]">
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
    toast.success("Added to schedule")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-[440px]",
          "duration-100 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100",
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col bg-white p-6">
          <div className="space-y-1 pr-8">
            <DialogTitle className="font-serif text-[20px] font-bold tracking-tight text-[#1A1F1E]">
              Add to schedule
            </DialogTitle>
            <DialogDescription className="text-left text-[13px] font-medium leading-relaxed text-muted-foreground">
              Append a working period or blocked break to one day.
            </DialogDescription>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-day" className="text-[13px] font-bold text-[#1A1F1E]">
                  Day
                </Label>
                <Select value={weekday} onValueChange={(v) => setWeekday(v as WeekdayId)}>
                  <SelectTrigger id="add-day" className={fieldSelectClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]/60">
                    {days.map((d) => (
                      <SelectItem key={d.weekday} value={d.weekday} className="text-[13px]">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-type" className="text-[13px] font-bold text-[#1A1F1E]">
                  Type
                </Label>
                <Select value={kind} onValueChange={(v) => setKind(v as EntryKind)}>
                  <SelectTrigger id="add-type" className={fieldSelectClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E8E6E0]/60">
                    <SelectItem value="block" className="text-[13px]">
                      Blocked time (break / admin)
                    </SelectItem>
                    <SelectItem value="period" className="text-[13px]">
                      Working period
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimePicker label="From" value={startTime} onChange={setStartTime} />
              <TimePicker label="To" value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="h-9 min-w-[100px] rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 min-w-[100px] rounded-lg bg-[#1A5345] text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] hover:bg-[#133F34]"
            >
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
