"use client"

import {
  CheckCircleIcon,
  MoonIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  accountShiftStatusStyles,
  accountStatCellClassName,
} from "@/app/(assistant)/assistant-account/assistantAccount.shared"

import {
  ASSISTANT_SHIFT_STATUS_LABELS,
  ASSISTANT_SHIFT_WEEKDAY_BADGES,
  ASSISTANT_SHIFT_WEEKDAY_LABELS,
  isAssistantShiftToday,
  shiftDetailLabel,
} from "./assistantShifts.utils"
import type {
  AssistantShiftStatus,
  AssistantWeeklyShiftDay,
} from "./doctorAssistants.shifts.types"

const SHIFT_STATUS_ICON: Record<AssistantShiftStatus, LucideIcon> = {
  active: CheckCircleIcon,
  "half-day": SunIcon,
  holiday: MoonIcon,
}

const SHIFT_STATUS_ICON_COLOR: Record<AssistantShiftStatus, string> = {
  active: "text-[#1A5345]",
  "half-day": "text-amber-600",
  holiday: "text-muted-foreground",
}

type DoctorShiftScheduleRowProps = {
  day: AssistantWeeklyShiftDay
  clinicName?: string | null
  onChange: (next: AssistantWeeklyShiftDay) => void
}

export function DoctorShiftScheduleRow({
  day,
  clinicName,
  onChange,
}: DoctorShiftScheduleRowProps) {
  const style = accountShiftStatusStyles[day.status]
  const StatusIcon = SHIFT_STATUS_ICON[day.status]
  const isToday = isAssistantShiftToday(day.weekday)
  const detailPrimary = shiftDetailLabel(day.status, day.startTime, day.endTime)
  const isOff = day.status === "holiday"
  const note = day.note?.trim() || clinicName?.trim() || null

  return (
    <div
      className={cn(
        accountStatCellClassName,
        style.rowClass,
        "flex-col items-stretch gap-0 p-0 transition-all hover:border-[#1A5345]/20 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3 p-3 sm:p-4">
        <StatusIcon
          className={cn("size-5 shrink-0", SHIFT_STATUS_ICON_COLOR[day.status])}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[18px] font-bold leading-none tabular-nums text-[#1A1F1E]">
              {ASSISTANT_SHIFT_WEEKDAY_BADGES[day.weekday]}
            </span>
            <span className="text-[13px] font-semibold text-[#1A1F1E]">
              {ASSISTANT_SHIFT_WEEKDAY_LABELS[day.weekday]}
            </span>
            {isToday ? (
              <span className="rounded-md bg-[#1A5345] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Today
              </span>
            ) : null}
            <Badge
              variant="default"
              className={cn(
                "ms-auto shrink-0 gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold",
                style.badgeClass,
              )}
            >
              {ASSISTANT_SHIFT_STATUS_LABELS[day.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-[#6B7870]">{detailPrimary}</p>
          {note ? (
            <p className="mt-0.5 truncate text-[11px] font-medium text-[#6B7870]">{note}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/40 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[140px] flex-1">
            <Label className="mb-1.5 block text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
              Shift status
            </Label>
            <Select
              value={day.status}
              onValueChange={(value: AssistantShiftStatus) => {
                if (value === "holiday") {
                  onChange({
                    ...day,
                    status: value,
                    startTime: null,
                    endTime: null,
                  })
                  return
                }
                onChange({
                  ...day,
                  status: value,
                  startTime: day.startTime ?? "09:00",
                  endTime: day.endTime ?? "17:00",
                })
              }}
            >
              <SelectTrigger className="h-9 w-full rounded-lg border-[#E8E6E0] bg-white text-[12px] font-semibold shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ASSISTANT_SHIFT_STATUS_LABELS) as AssistantShiftStatus[]).map(
                  (status) => (
                    <SelectItem key={status} value={status} className="text-[12px]">
                      {ASSISTANT_SHIFT_STATUS_LABELS[status]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {!isOff ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <Label
                  htmlFor={`${day.weekday}-start`}
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-tight text-[#6B7870]"
                >
                  From
                </Label>
                <input
                  id={`${day.weekday}-start`}
                  type="time"
                  className="h-9 rounded-lg border border-[#E8E6E0] bg-white px-2 text-[12px] font-medium shadow-sm outline-none focus-visible:border-[#1A5345]/30 focus-visible:ring-2 focus-visible:ring-[#1A5345]/15"
                  value={day.startTime ?? "09:00"}
                  onChange={(e) => onChange({ ...day, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label
                  htmlFor={`${day.weekday}-end`}
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-tight text-[#6B7870]"
                >
                  To
                </Label>
                <input
                  id={`${day.weekday}-end`}
                  type="time"
                  className="h-9 rounded-lg border border-[#E8E6E0] bg-white px-2 text-[12px] font-medium shadow-sm outline-none focus-visible:border-[#1A5345]/30 focus-visible:ring-2 focus-visible:ring-[#1A5345]/15"
                  value={day.endTime ?? "17:00"}
                  onChange={(e) => onChange({ ...day, endTime: e.target.value })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
