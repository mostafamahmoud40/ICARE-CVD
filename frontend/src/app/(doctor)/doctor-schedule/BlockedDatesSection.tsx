"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { format, parseISO, isBefore, startOfDay } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"

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
    <section className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] animate-in fade-in duration-500">
      <div className="border-b border-[#E8E6E0]/50 bg-[#FAFAF8]/80 px-5 py-4 sm:px-6">
        <h2 className="font-serif text-[16px] font-bold text-[#1A1F1E] sm:text-[17px]">Blocked dates</h2>
        <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">
          Mark whole days unavailable — vacation, conference, or time off
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row">
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
              blocked: "bg-[#1A5345] text-white hover:bg-[#0F3D32] rounded-md",
            }}
            className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4 shadow-sm"
            classNames={{
              day: "h-9 w-9 sm:h-10 sm:w-10 text-[12px] cursor-pointer rounded-lg hover:bg-[#E8E6E0]/50 transition-colors",
              caption: "text-[14px] font-bold mb-4",
              nav_button: "h-8 w-8 hover:bg-[#E8E6E0]/50 rounded-lg transition-colors",
            }}
          />

          <div className="px-1 text-[12px] text-muted-foreground">
            Click any date to block/unblock. Days appear in the order you select them.
          </div>
        </div>

        {/* Controls & List */}
        <div className="flex-1 space-y-4">
          {/* Reason input - applies to newly blocked dates */}
          <div className="space-y-2 rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] p-4 shadow-sm">
            <Label htmlFor="block-reason" className="text-[12px] font-semibold text-[#1A1F1E]">
              Default reason (for newly blocked dates)
            </Label>
            <Input
              id="block-reason"
              type="text"
              placeholder="e.g., Vacation, Conference, Sick leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-10 rounded-xl border-[#E8E6E0] bg-white text-[13px] focus-visible:ring-[#1A5345]"
            />
            <p className="pt-1 text-[12px] text-muted-foreground">
              Click any date in the calendar to block it. Click again to unblock.
            </p>
          </div>

          {/* Blocked dates list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-[#1A1F1E]">Blocked dates</h3>
              {blockedDates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-[10px] sm:text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md px-2"
                >
                  Clear all
                </Button>
              )}
            </div>

            {blockedDates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E8E6E0] bg-[#F9F8F5]/50 p-6 text-center text-[13px] text-muted-foreground">
                No blocked dates. Click dates on the calendar to block them.
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(groupedDates).map(([groupReason, dates]) => (
                  <div
                    key={groupReason}
                    className="rounded-xl border border-[#E8E6E0] bg-[#FAFAF8] p-3 shadow-sm"
                  >
                    <div className="mb-2 text-[10px] sm:text-[11px] font-bold text-[#1A5345] uppercase tracking-wide">
                      {groupReason}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dates.map((bd) => (
                        <div
                          key={bd.id}
                          className="flex items-center gap-1.5 rounded-md border border-[#E8E6E0] bg-white pl-2.5 pr-1 py-1 text-[11px] sm:text-[12px] font-medium text-[#1A1F1E] shadow-sm"
                        >
                          <span>{formatDateDisplay(bd.date)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={() => handleRemove(bd.id)}
                          >
                            <Trash2Icon className="size-3.5" />
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
