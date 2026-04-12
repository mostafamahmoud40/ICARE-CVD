"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"
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

function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full rounded-lg border border-[#C5D0CC]/90 bg-background pr-10 pl-3 text-sm font-medium text-foreground shadow-xs outline-none transition-colors",
            "focus-visible:border-[#00392D]/50 focus-visible:ring-2 focus-visible:ring-[#00392D]/20",
            "dark:border-white/15"
          )}
        />
        <ClockIcon
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
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
        <SheetHeader className="space-y-3 border-b border-border/60 px-6 pb-5 pt-8 text-left">
          <SheetTitle className="font-serif text-2xl font-semibold leading-tight tracking-tight text-[#1A1F1E] dark:text-foreground">
            Add to schedule
          </SheetTitle>
          <SheetDescription className="text-left text-[15px] leading-relaxed text-[#6B7870] dark:text-muted-foreground">
            Quickly append a working period or a blocked break to one day. You can still edit
            everything in the section below.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="add-day" className="text-sm font-medium text-[#1A1F1E] dark:text-foreground">
                Day
              </Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v as WeekdayId)}>
                <SelectTrigger
                  id="add-day"
                  className="h-11 rounded-lg border-[#C5D0CC]/90 font-medium shadow-xs dark:border-white/15"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d.weekday} value={d.weekday}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-type" className="text-sm font-medium text-[#1A1F1E] dark:text-foreground">
                Type
              </Label>
              <Select value={kind} onValueChange={(v) => setKind(v as EntryKind)}>
                <SelectTrigger
                  id="add-type"
                  className="h-11 rounded-lg border-[#C5D0CC]/90 font-medium shadow-xs dark:border-white/15"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Blocked time (break / admin)</SelectItem>
                  <SelectItem value="period">Working period</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TimeField id="add-start" label="From" value={startTime} onChange={setStartTime} />
              <TimeField id="add-end" label="To" value={endTime} onChange={setEndTime} />
            </div>
          </div>

          <SheetFooter className="flex flex-row justify-end gap-3 border-t border-border/60 bg-muted/15 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-[100px] rounded-lg border-[#C5D0CC] bg-background font-medium text-foreground hover:bg-muted/50"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 min-w-[100px] rounded-lg bg-[#00392D] font-semibold text-white shadow-sm hover:bg-[#002620]"
            >
              Add
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
