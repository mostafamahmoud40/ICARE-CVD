"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO, isBefore, startOfDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

import type { BlockedDate } from "./doctorSchedule.types"

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `bd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function formatDateDisplay(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy")
}

type BlockedDatesSectionProps = {
  blockedDates: BlockedDate[]
  onChange: (blockedDates: BlockedDate[]) => void
}

export function BlockedDatesSection({ blockedDates, onChange }: BlockedDatesSectionProps) {
  const [reason, setReason] = React.useState("")

  // Convert blockedDates to Date objects for the calendar
  const blockedDateObjects = React.useMemo(
    () => blockedDates.map((bd) => parseISO(bd.date)),
    [blockedDates]
  )

  // Get today's date
  const today = startOfDay(new Date())

  // Direct toggle: click to block, click again to unblock
  const handleDayClick = (date: Date) => {
    // Don't allow clicking past dates
    if (isBefore(startOfDay(date), today)) {
      toast.error("Cannot block dates in the past")
      return
    }

    const dateStr = format(date, "yyyy-MM-dd")
    const existingIndex = blockedDates.findIndex((bd) => bd.date === dateStr)

    if (existingIndex >= 0) {
      // Already blocked -> remove it
      const newBlockedDates = blockedDates.filter((bd) => bd.date !== dateStr)
      onChange(newBlockedDates)
      toast.success("Date unblocked")
    } else {
      // Not blocked -> add it
      const newBlockedDate: BlockedDate = {
        id: generateId(),
        date: dateStr,
        reason: reason || undefined,
      }
      onChange([...blockedDates, newBlockedDate])
      toast.success("Date blocked")
    }
  }

  const handleRemove = (id: string) => {
    onChange(blockedDates.filter((bd) => bd.id !== id))
    toast.success("Date unblocked")
  }

  const handleClearAll = () => {
    onChange([])
    toast.success("All dates cleared")
  }

  // Group blocked dates by reason (sorted by date added, not by calendar order)
  const groupedDates = React.useMemo(() => {
    const groups: Record<string, BlockedDate[]> = {}
    blockedDates.forEach((bd) => {
      const key = bd.reason || "No reason"
      if (!groups[key]) groups[key] = []
      groups[key].push(bd)
    })
    // Don't sort within groups - keep as added
    return groups
  }, [blockedDates])

  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
        <h2 className="text-base font-semibold">Blocked Dates</h2>
        <p className="text-sm text-muted-foreground">
          Select dates on the calendar when you&apos;re unavailable (click multiple dates)
        </p>
      </div>

      <div className="flex flex-col gap-4 p-4 lg:flex-row">
        {/* Calendar */}
        <div className="flex flex-col gap-3">
          <Calendar
            key={`calendar-${blockedDates.length}`}
            mode="multiple"
            selected={blockedDateObjects}
            onDayClick={handleDayClick}
            disabled={(date) => isBefore(startOfDay(date), today)}
            modifiers={{
              blocked: blockedDateObjects,
            }}
            modifiersClassNames={{
              blocked: "bg-[#A8C4BC] text-[#00392D] hover:bg-[#8FB0A6] rounded-lg",
            }}
            className="rounded-lg border p-4"
            classNames={{
              day: "h-10 w-10 text-sm cursor-pointer",
              caption: "text-base mb-4",
              nav_button: "h-8 w-8",
            }}
          />

          <div className="text-xs text-muted-foreground">
            Click any date to block/unblock. Days appear in the order you select them.
          </div>
        </div>

        {/* Controls & List */}
        <div className="flex-1 space-y-4">
          {/* Reason input - applies to newly blocked dates */}
          <div className="space-y-2 rounded-lg border p-3">
            <Label htmlFor="block-reason" className="text-sm font-medium">
              Default Reason (for newly blocked dates)
            </Label>
            <Input
              id="block-reason"
              type="text"
              placeholder="e.g., Vacation, Conference, Sick leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Click any date in the calendar to block it. Click again to unblock.
            </p>
          </div>

          {/* Blocked dates list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Blocked dates:</h3>
              {blockedDates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  Clear all
                </Button>
              )}
            </div>

            {blockedDates.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No blocked dates. Click dates on the calendar to block them.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedDates).map(([groupReason, dates]) => (
                  <div
                    key={groupReason}
                    className="rounded-lg border border-[#A8C4BC]/50 bg-[#E8F0EE]/50 p-2"
                  >
                    <div className="mb-1 text-xs font-medium text-[#00392D]">
                      {groupReason}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dates.map((bd) => (
                        <div
                          key={bd.id}
                          className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-sm shadow-sm"
                        >
                          <span>{formatDateDisplay(bd.date)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(bd.id)}
                          >
                            <Trash2Icon className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
