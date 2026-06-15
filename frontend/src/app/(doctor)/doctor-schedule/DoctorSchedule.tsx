"use client"

import * as React from "react"
import {
  BanIcon,
  CalendarDaysIcon,
  PlusIcon,
  RotateCcwIcon,
  SaveIcon,
  Table2Icon,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

import { AddToScheduleSheet } from "./AddToScheduleSheet"
import { BlockedDatesSection } from "./BlockedDatesSection"
import { ScheduleTable } from "./ScheduleTable"
import { WeeklyScheduleOverview } from "./WeeklyScheduleOverview"
import { doctorScheduleSchema } from "./doctorSchedule.schema"
import type { DayAvailability, DoctorSchedulePayload, WeekdayId } from "./doctorSchedule.types"
import { createTimeBlock, createEmptySchedule } from "./doctorSchedule.utils"
import { useDoctorSchedule } from "./useDoctorSchedule"

function formatTodayHeading() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

type ScheduleView = "overview" | "details" | "blocked"

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
  const [view, setView] = React.useState<ScheduleView>("overview")

  React.useEffect(() => {
    if (schedule) {
      setDraft(schedule)
    }
  }, [schedule])

  const hasChanges = React.useMemo(() => {
    if (!schedule || !draft) return false
    return JSON.stringify(schedule) !== JSON.stringify(draft)
  }, [schedule, draft])

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
      <div className="flex h-[calc(100vh-4rem)] w-full min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 py-6 sm:px-8">
        <div className="w-full min-w-0 space-y-6">
          <div className="w-full rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm">
            <Skeleton className="mb-3 h-3 w-40" />
            <Skeleton className="mb-3 h-8 w-[min(100%,280px)]" />
            <Skeleton className="h-4 w-[min(100%,480px)]" />
          </div>
          <Skeleton className="h-10 w-full max-w-xl rounded-xl bg-[#E8E6E0]/50" />
          <Skeleton className="h-56 w-full rounded-2xl bg-[#E8E6E0]/50" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-gradient-to-br from-white via-[#FFFCFA] to-[#E8F0EE]/30">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#1A5345]/15 via-[#CC5533]/35 to-[#1A5345]/15"
          aria-hidden
        />
        <div className="flex flex-col px-6 pb-5 pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <div className="flex items-center gap-2">
            <p className="border-l-[3px] border-[#CC5533] pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:text-[12px]">
              {formatTodayHeading()}
            </p>
            {hasChanges ? (
              <Badge className="h-6 gap-1.5 rounded-lg border-amber-200 bg-amber-50 px-2 text-[10px] font-bold text-amber-700">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                Unsaved changes
              </Badge>
            ) : null}
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:mt-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[24px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px] lg:text-[28px]">
                Weekly Schedule
              </h1>
              <p className="text-[13px] font-medium text-[#6B7870] sm:text-[14px]">
                Manage your clinic availability, working periods, breaks, and blocked dates — saved
                to your doctor profile.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:border-[#1A5345]/30 hover:bg-slate-50 hover:text-[#1A5345] hover:shadow-md"
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <RotateCcwIcon className="size-3.5" aria-hidden />
                Reset schedule
              </Button>
              <Button
                type="button"
                size="sm"
                className="group h-8 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(26,83,69,0.2)] transition-all hover:bg-[#133F34] hover:shadow-[0_4px_14px_rgba(26,83,69,0.25)]"
                onClick={() => setAddOpen(true)}
              >
                <PlusIcon className="size-3.5 transition-transform group-hover:scale-110" aria-hidden />
                Add to schedule
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F9F8F5] px-6 pb-24 pt-6 sm:px-8 sm:pb-28 sm:pt-8">
        <div className="w-full min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-1.5 shadow-sm">
            <div className="flex min-w-0 flex-wrap gap-2">
              <Button
                type="button"
                variant={view === "overview" ? "default" : "ghost"}
                className={cn(
                  "h-8 rounded-lg px-3 text-[12px] font-bold sm:px-4",
                  view === "overview"
                    ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                    : "text-[#1A1F1E]",
                )}
                onClick={() => setView("overview")}
              >
                <Table2Icon className="mr-2 size-4 shrink-0" aria-hidden />
                Weekly overview
              </Button>
              <Button
                type="button"
                variant={view === "details" ? "default" : "ghost"}
                className={cn(
                  "h-8 rounded-lg px-3 text-[12px] font-bold sm:px-4",
                  view === "details"
                    ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                    : "text-[#1A1F1E]",
                )}
                onClick={() => setView("details")}
              >
                <CalendarDaysIcon className="mr-2 size-4 shrink-0" aria-hidden />
                Schedule details
              </Button>
              <Button
                type="button"
                variant={view === "blocked" ? "default" : "ghost"}
                className={cn(
                  "h-8 rounded-lg px-3 text-[12px] font-bold sm:px-4",
                  view === "blocked"
                    ? "bg-[#1A5345] text-white hover:bg-[#133F34]"
                    : "text-[#1A1F1E]",
                )}
                onClick={() => setView("blocked")}
              >
                <BanIcon className="mr-2 size-4 shrink-0" aria-hidden />
                Blocked dates
                {draft.blockedDates.length > 0 ? (
                  <Badge
                    className={cn(
                      "ml-1.5 h-5 rounded-md px-1.5 text-[10px] font-bold tabular-nums",
                      view === "blocked"
                        ? "bg-white/20 text-white hover:bg-white/20"
                        : "bg-red-50 text-red-700",
                    )}
                  >
                    {draft.blockedDates.length}
                  </Badge>
                ) : null}
              </Button>
            </div>
          </div>

          {view === "overview" ? (
            <WeeklyScheduleOverview
              schedule={draft}
              onSlotDurationMinutesChange={(minutes) =>
                setDraft((prev) => (prev ? { ...prev, slotDurationMinutes: minutes } : prev))
              }
              onBufferMinutesChange={(minutes) =>
                setDraft((prev) => (prev ? { ...prev, bufferBetweenSlotsMinutes: minutes } : prev))
              }
            />
          ) : null}

          {view === "details" ? (
            <ScheduleTable
              days={draft.days}
              onDayChange={(next) =>
                setDraft((prev) => (prev ? { ...prev, days: replaceDay(prev.days, next) } : prev))
              }
            />
          ) : null}

          {view === "blocked" ? (
            <BlockedDatesSection
              blockedDates={draft.blockedDates}
              onChange={(blockedDates) =>
                setDraft((prev) => (prev ? { ...prev, blockedDates } : prev))
              }
            />
          ) : null}
        </div>
      </div>

      {hasChanges ? (
        <div className="sticky bottom-0 z-30 border-t border-[#E8E6E0]/70 bg-white/95 px-6 py-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              <p className="text-[13px] font-medium text-[#1A1F1E] sm:text-[14px]">
                Schedule has unsaved changes
              </p>
            </div>
            <Button
              type="button"
              className="rounded-xl bg-[#1A5345] px-6 font-bold text-white shadow-[0_4px_20px_-6px_rgba(26,83,69,0.3)] hover:bg-[#133F34]"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              <SaveIcon className="mr-2 size-4" aria-hidden />
              {isSaving ? "Saving…" : "Save schedule"}
            </Button>
          </div>
        </div>
      ) : null}

      <AddToScheduleSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        days={draft.days}
        onAdd={handleQuickAdd}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="gap-0 rounded-2xl border border-[#E8E6E0]/70 bg-white p-6 shadow-2xl sm:max-w-[400px]">
          <AlertDialogHeader className="place-items-start text-left sm:place-items-start sm:text-left">
            <AlertDialogTitle className="font-serif text-[20px] font-bold tracking-tight text-[#1A1F1E]">
              Reset schedule?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[13px] font-medium leading-relaxed text-muted-foreground">
              This will clear all your working hours and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex flex-row justify-end gap-2.5 sm:justify-end">
            <AlertDialogCancel className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="h-9 rounded-lg border-0 bg-red-600 text-[12px] font-bold text-white shadow-sm hover:bg-red-700"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
