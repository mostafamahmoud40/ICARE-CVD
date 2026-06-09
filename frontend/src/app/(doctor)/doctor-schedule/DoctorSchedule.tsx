"use client"

import * as React from "react"
import { CalendarClockIcon, PlusIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { AddToScheduleSheet } from "./AddToScheduleSheet"
import { BlockedDatesSection } from "./BlockedDatesSection"
import { ScheduleTable } from "./ScheduleTable"
import { WeeklyScheduleOverview } from "./WeeklyScheduleOverview"
import { doctorScheduleSchema } from "./doctorSchedule.schema"
import type { DayAvailability, DoctorSchedulePayload, WeekdayId } from "./doctorSchedule.types"
import { createTimeBlock, createEmptySchedule } from "./doctorSchedule.utils"
import { useDoctorSchedule } from "./useDoctorSchedule"

function replaceDay(
  days: DayAvailability[],
  next: DayAvailability
): DayAvailability[] {
  return days.map((d) => (d.weekday === next.weekday ? next : d))
}

export function DoctorSchedule() {
  const { schedule, isLoading, saveScheduleAsync, isSaving, deleteScheduleAsync, isDeleting } = useDoctorSchedule()
  const [draft, setDraft] = React.useState<DoctorSchedulePayload | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (schedule) {
      setDraft(schedule)
    }
  }, [schedule])

  const handleSave = async () => {
    if (!draft) return

    const hasAnyEnabledDay = draft.days.some((d) => d.enabled)
    const hasAnyPeriod = draft.days.some((d) => d.periods.length > 0)

    if (!hasAnyEnabledDay && !hasAnyPeriod) {
      toast.error("Nothing to save", {
        description: "Enable at least one day and add a working period first.",
      })
      return
    }

    // Check for duplicate blocked dates
    const dates = draft.blockedDates.map((bd) => bd.date)
    const uniqueDates = new Set(dates)
    if (dates.length !== uniqueDates.size) {
      toast.error("Duplicate blocked dates found")
      return
    }

    const result = doctorScheduleSchema.safeParse(draft)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? "Invalid values."
      toast.error("Check your schedule", { description: msg })
      return
    }
    await saveScheduleAsync(result.data)
  }

  const handleDelete = async () => {
    await deleteScheduleAsync()
    setDraft(createEmptySchedule())
    setDeleteDialogOpen(false)
    toast.success("Schedule reset successfully")
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F5]">
        <main className="w-full space-y-4 sm:space-y-5 p-3 sm:p-4 lg:p-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-[#E8E6E0]/50" />
            <Skeleton className="h-4 w-full max-w-xl bg-[#E8E6E0]/50" />
          </div>
          <Skeleton className="h-56 w-full rounded-2xl bg-[#E8E6E0]/50" />
          <Skeleton className="h-96 w-full rounded-xl bg-[#E8E6E0]/50" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F9F8F5]">
      <main className="w-full space-y-4 sm:space-y-5 p-3 sm:p-4 lg:p-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 sm:size-5 text-[#1A5345]" aria-hidden />
              <h1 className="font-sans text-[13px] sm:text-[15px] font-bold text-[#1A1F1E]">
                Weekly Schedule
              </h1>
            </div>
            <p className="font-sans text-[10px] sm:text-[11px] text-muted-foreground">
              Your default week is shown first. Use <span className="font-medium text-[#1A1F1E]">Add to schedule</span> for quick entries.
            </p>
          </div>
          <Button
            type="button"
            className="h-9 shrink-0 gap-1.5 shadow-sm rounded-lg bg-[#1A5345] hover:bg-[#0F3D32] text-white"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="size-3.5" aria-hidden />
            <span className="text-[11px] sm:text-[12px] font-semibold">Add to schedule</span>
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

        <BlockedDatesSection
          blockedDates={draft.blockedDates}
          onChange={(blockedDates) =>
            setDraft((prev) => prev ? { ...prev, blockedDates } : prev)
          }
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-9 min-w-[120px] gap-1.5 rounded-lg border-[#E8E6E0] bg-white text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5]"
            disabled={isDeleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <RotateCcwIcon className="size-3.5" />
            <span className="text-[11px] sm:text-[12px] font-semibold">{isDeleting ? "Deleting…" : "Reset schedule"}</span>
          </Button>
          <Button
            type="button"
            className="h-9 min-w-[140px] shadow-sm rounded-lg bg-[#1A5345] hover:bg-[#0F3D32] text-white"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            <span className="text-[11px] sm:text-[12px] font-semibold">{isSaving ? "Saving…" : "Save schedule"}</span>
          </Button>
        </div>
      </main>

      <AddToScheduleSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        days={draft.days}
        onAdd={handleQuickAdd}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent size="sm" className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans text-[15px] font-bold text-[#1A1F1E]">Reset schedule?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-muted-foreground">
              This will clear all your working hours and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 rounded-lg border-[#E8E6E0] text-[12px] font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold shadow-sm">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
