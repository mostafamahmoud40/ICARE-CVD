"use client"

import * as React from "react"
import { CalendarClockIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { doctorScheduleSchema } from "./doctorSchedule.schema"
import type { DayAvailability, DoctorSchedulePayload } from "./doctorSchedule.types"
import { useDoctorSchedule } from "./useDoctorSchedule"

const SLOT_OPTIONS = [15, 20, 30, 45, 60] as const

function updateDay(
  days: DayAvailability[],
  weekday: DayAvailability["weekday"],
  patch: Partial<DayAvailability>
): DayAvailability[] {
  return days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
}

export function DoctorSchedule() {
  const { schedule, isLoading, saveScheduleAsync, isSaving } = useDoctorSchedule()
  const [draft, setDraft] = React.useState<DoctorSchedulePayload | null>(null)

  React.useEffect(() => {
    if (schedule) {
      setDraft(schedule)
    }
  }, [schedule])

  const handleSave = async () => {
    if (!draft) return
    const result = doctorScheduleSchema.safeParse(draft)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "Invalid values."
      toast.error("Check your schedule", { description: msg })
      return
    }
    await saveScheduleAsync(result.data)
  }

  if (isLoading || !draft) {
    return (
      <main className="w-full space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="w-full space-y-6 p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <CalendarClockIcon className="size-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Clinic hours
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Weekly schedule</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choose the days you see patients and your working hours. Patients will only be able
          to book inside these windows. Changes apply to future availability once the backend is
          connected; until then they are saved in this browser.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save schedule"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Working days</CardTitle>
          <CardDescription>
            Toggle each day and set start and end times. Disabled days show as unavailable for
            booking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {draft.days.map((day) => (
            <div
              key={day.weekday}
              className="flex flex-col gap-3 rounded-lg border border-border/80 bg-card/40 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-[140px] items-center gap-2">
                <Checkbox
                  id={`day-${day.weekday}`}
                  checked={day.enabled}
                  onCheckedChange={(v) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            days: updateDay(prev.days, day.weekday, {
                              enabled: v === true,
                            }),
                          }
                        : prev
                    )
                  }
                />
                <Label htmlFor={`day-${day.weekday}`} className="cursor-pointer font-medium">
                  {day.label}
                </Label>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <span className="text-xs text-muted-foreground sm:sr-only">From</span>
                <input
                  type="time"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
                  value={day.startTime}
                  disabled={!day.enabled}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            days: updateDay(prev.days, day.weekday, {
                              startTime: e.target.value,
                            }),
                          }
                        : prev
                    )
                  }
                  aria-label={`${day.label} start`}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
                  value={day.endTime}
                  disabled={!day.enabled}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            days: updateDay(prev.days, day.weekday, {
                              endTime: e.target.value,
                            }),
                          }
                        : prev
                    )
                  }
                  aria-label={`${day.label} end`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment slot length</CardTitle>
          <CardDescription>
            Used when generating time slots for booking (e.g. 30-minute visits).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Label htmlFor="slot-duration" className="sm:min-w-32">
            Slot duration
          </Label>
          <Select
            value={String(draft.slotDurationMinutes)}
            onValueChange={(v) =>
              setDraft((prev) =>
                prev ? { ...prev, slotDurationMinutes: Number(v) } : prev
              )
            }
          >
            <SelectTrigger id="slot-duration" className="w-full sm:w-[200px]">
              <SelectValue placeholder="Minutes" />
            </SelectTrigger>
            <SelectContent>
              {SLOT_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </main>
  )
}
