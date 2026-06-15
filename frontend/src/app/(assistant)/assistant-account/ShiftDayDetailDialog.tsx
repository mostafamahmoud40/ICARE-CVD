"use client"

import type { ComponentType } from "react"
import {
  Building2Icon,
  CalendarDaysIcon,
  ClockIcon,
  StethoscopeIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { ShiftEntry } from "./assistantAccount.types"
import { accountShiftStatusStyles } from "./assistantAccount.shared"

const SHIFT_FALLBACK_BY_INDEX: { dayName: string; dayBadge: string }[] = [
  { dayName: "Sunday", dayBadge: "Su" },
  { dayName: "Monday", dayBadge: "Mo" },
  { dayName: "Tuesday", dayBadge: "Tu" },
  { dayName: "Wednesday", dayBadge: "We" },
  { dayName: "Thursday", dayBadge: "Th" },
  { dayName: "Friday", dayBadge: "Fr" },
  { dayName: "Saturday", dayBadge: "Sa" },
]

function isShiftToday(dayName: string) {
  const todayName = SHIFT_FALLBACK_BY_INDEX[new Date().getDay()]?.dayName
  return Boolean(todayName && dayName === todayName)
}

function shiftDetailPrimary(shift: ShiftEntry): string {
  if (shift.timeRange && shift.timeRange.length > 0) return shift.timeRange
  if (shift.status === "holiday") return "Day off"
  return "Hours not set"
}

function parseShiftNote(note?: string) {
  if (!note?.trim()) return {}
  const parts = note.split(" · ").map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { location: parts[0], doctor: parts.slice(1).join(" · ") }
  }
  return { extra: note.trim() }
}

function DetailCell({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[96px] flex-col justify-between rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4 sm:min-h-[100px] sm:p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870] sm:text-[12px]">
          {label}
        </p>
      </div>
      <p className="mt-3 font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] sm:text-[16px]">
        {value}
      </p>
    </div>
  )
}

type ShiftDayDetailDialogProps = {
  shift: ShiftEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShiftDayDetailDialog({ shift, open, onOpenChange }: ShiftDayDetailDialogProps) {
  if (!shift) return null

  const style = accountShiftStatusStyles[shift.status]
  const today = isShiftToday(shift.dayName)
  const hours = shiftDetailPrimary(shift)
  const parsedNote = parseShiftNote(shift.note)

  const detailCells: Array<{
    key: string
    icon: ComponentType<{ className?: string }>
    label: string
    value: string
    span?: boolean
  }> = [
    { key: "hours", icon: ClockIcon, label: "Hours", value: hours },
    { key: "status", icon: CalendarDaysIcon, label: "Shift status", value: style.label },
  ]

  if (parsedNote.location) {
    detailCells.push({
      key: "location",
      icon: Building2Icon,
      label: "Location",
      value: parsedNote.location,
    })
  }
  if (parsedNote.doctor) {
    detailCells.push({
      key: "doctor",
      icon: StethoscopeIcon,
      label: "Assigned doctor",
      value: parsedNote.doctor,
    })
  }
  if (parsedNote.extra) {
    detailCells.push({
      key: "notes",
      icon: CalendarDaysIcon,
      label: "Notes",
      value: parsedNote.extra,
      span: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-[520px]"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg border border-[#E8E6E0]/60 bg-white/90 text-muted-foreground shadow-sm transition-colors hover:bg-[#F9F8F5] hover:text-[#1A5345] sm:right-4 sm:top-4"
          aria-label="Close"
        >
          <XIcon className="size-3.5" />
        </button>

        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6">
          <DialogHeader className="gap-0 space-y-0 text-left">
            <div className="flex items-start gap-3.5 pr-8">
              <CalendarDaysIcon className="mt-0.5 size-6 shrink-0 text-[#1A5345] sm:size-7" aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="font-serif text-[20px] font-bold leading-tight text-[#1A1F1E] sm:text-[22px]">
                    {shift.dayName}
                  </DialogTitle>
                  {today ? (
                    <span className="rounded-md bg-[#1A5345] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Today
                    </span>
                  ) : null}
                  <Badge
                    variant="default"
                    className={cn("gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold", style.badgeClass)}
                  >
                    {style.label}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {detailCells.map((cell) => (
              <DetailCell
                key={cell.key}
                icon={cell.icon}
                label={cell.label}
                value={cell.value}
                className={cell.span ? "col-span-2" : undefined}
              />
            ))}
          </div>

          {shift.status === "holiday" ? (
            <p className="rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] px-4 py-3.5 text-[13px] font-medium leading-relaxed text-muted-foreground sm:text-[14px]">
              You are not scheduled to work on this day. Use this time for rest or approved leave.
            </p>
          ) : shift.status === "half-day" ? (
            <p className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3.5 text-[13px] font-medium leading-relaxed text-amber-900/80 sm:text-[14px]">
              This is a shortened shift. Confirm handover tasks before leaving early.
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/40 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-xl border-[#E8E6E0] bg-white text-[13px] font-bold text-[#1A5345] shadow-sm hover:bg-white hover:text-[#133F34]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
