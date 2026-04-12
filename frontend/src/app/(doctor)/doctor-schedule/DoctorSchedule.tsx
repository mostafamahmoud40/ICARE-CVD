"use client"

import * as React from "react"
import { CalendarClockIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { AddToScheduleSheet } from "./AddToScheduleSheet"
import { ScheduleTable } from "./ScheduleTable"
import { WeeklyScheduleOverview } from "./WeeklyScheduleOverview"
import { doctorScheduleSchema } from "./doctorSchedule.schema"
import type { DayAvailability, DoctorSchedulePayload, WeekdayId } from "./doctorSchedule.types"
import { createTimeBlock } from "./doctorSchedule.utils"
import { useDoctorSchedule } from "./useDoctorSchedule"

function replaceDay(
  days: DayAvailability[],
  next: DayAvailability
): DayAvailability[] {
  return days.map((d) => (d.weekday === next.weekday ? next : d))
}

export function DoctorSchedule() {
  const { schedule, isLoading, saveScheduleAsync, isSaving } = useDoctorSchedule()
  const [draft, setDraft] = React.useState<DoctorSchedulePayload | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

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

  const handleQuickAdd = (input: {
    weekday: WeekdayId
    kind: "period" | "block"
    startTime: string
    endTime: string
  }) => {
    setDraft((prev) => {
      if (!prev) return prev
      const day = prev.days.find((d) => d.weekday === input.weekday)
      if (!day) return prev
      const piece = createTimeBlock(input.startTime, input.endTime)
      if (input.kind === "block") {
        const next: DayAvailability = {
          ...day,
          enabled: true,
          unavailableBlocks: [...day.unavailableBlocks, piece],
        }
        return { ...prev, days: replaceDay(prev.days, next) }
      }
      const next: DayAvailability = {
        ...day,
        enabled: true,
        periods: [...day.periods, piece],
      }
      return { ...prev, days: replaceDay(prev.days, next) }
    })
  }

  if (isLoading || !draft) {
    return (
      <main className="w-full space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </main>
    )
  }

  return (
    <>
      <main className="w-full space-y-8 p-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <CalendarClockIcon className="size-5" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Clinic hours
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Weekly schedule
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Your default week is shown first. Use{" "}
              <span className="font-medium text-foreground">Add to schedule</span> for quick
              entries, then adjust details below.
            </p>
          </div>
          <Button
            type="button"
            className="h-11 shrink-0 gap-2 shadow-sm"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="size-4" aria-hidden />
            Add to schedule
          </Button>
        </header>

        <WeeklyScheduleOverview
          schedule={draft}
          onSlotDurationMinutesChange={(minutes) =>
            setDraft((prev) => (prev ? { ...prev, slotDurationMinutes: minutes } : prev))
          }
          onBufferMinutesChange={(minutes) =>
            setDraft((prev) => (prev ? { ...prev, bufferBetweenSlotsMinutes: minutes } : prev))
          }
        />

        <ScheduleTable days={draft.days} onDayChange={(next) =>
          setDraft((prev) => prev ? { ...prev, days: replaceDay(prev.days, next) } : prev)
        } />

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            size="lg"
            className="min-w-[180px] shadow-md"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save schedule"}
          </Button>
        </div>
      </main>

      <AddToScheduleSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        days={draft.days}
        onAdd={handleQuickAdd}
      />
    </>
  )
}
