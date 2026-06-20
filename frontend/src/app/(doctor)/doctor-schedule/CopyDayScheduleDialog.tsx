"use client"

import * as React from "react"
import { CopyIcon } from "lucide-react"
import { useLocale } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import type { DayAvailability, WeekdayId } from "./doctorSchedule.types"

type CopyDayScheduleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceDay: DayAvailability
  allDays: DayAvailability[]
  onCopy: (targetWeekdays: WeekdayId[]) => void
  labels?: Partial<{
    title: string
    description: string
    selectAll: string
    clearAll: string
    copy: string
    cancel: string
    noTargetsSelected: string
    successTitle: string
    successDescription: string
  }>
}

export function CopyDayScheduleDialog({
  open,
  onOpenChange,
  sourceDay,
  allDays,
  onCopy,
  labels,
}: CopyDayScheduleDialogProps) {
  const locale = useLocale()
  const t = {
    title: labels?.title ?? "Copy day schedule",
    description:
      labels?.description ?? "Copy working periods, breaks, and settings to other days.",
    selectAll: labels?.selectAll ?? "Select all",
    clearAll: labels?.clearAll ?? "Clear all",
    copy: labels?.copy ?? "Copy schedule",
    cancel: labels?.cancel ?? "Cancel",
    noTargetsSelected: labels?.noTargetsSelected ?? "Select at least one day.",
    successTitle: labels?.successTitle ?? "Schedule copied",
    successDescription:
      labels?.successDescription ?? "Selected days now match this day's schedule.",
  }

  const [selected, setSelected] = React.useState<Set<WeekdayId>>(new Set())

  const localizedWeekday = (day: DayAvailability) => {
    const idxMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }
    const idx = idxMap[day.weekday]
    if (idx === undefined) return day.label
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
      new Date(2024, 0, 7 + idx),
    )
  }

  const sourceLabel = localizedWeekday(sourceDay)
  const targetDays = allDays.filter((d) => d.weekday !== sourceDay.weekday)

  React.useEffect(() => {
    if (!open) {
      setSelected(new Set())
    }
  }, [open])

  const toggleDay = (weekday: WeekdayId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(weekday)) next.delete(weekday)
      else next.add(weekday)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelected(new Set(targetDays.map((d) => d.weekday)))
  }

  const handleClearAll = () => {
    setSelected(new Set())
  }

  const handleCopy = () => {
    if (selected.size === 0) {
      toast.error(t.noTargetsSelected)
      return
    }
    onCopy([...selected])
    toast.success(t.successTitle, { description: t.successDescription })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-2xl border border-[#E8E6E0]/70 bg-white p-6 shadow-2xl sm:max-w-[420px]">
        <DialogHeader className="place-items-start text-left sm:place-items-start sm:text-left">
          <DialogTitle className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E]">
            {t.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[13px] font-medium leading-relaxed text-muted-foreground">
            {t.description.replace("{day}", sourceLabel)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-[#1A1F1E]">
              {sourceLabel}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-[#1A5345] hover:bg-[#1A5345]/10 hover:text-[#1A5345]"
                onClick={handleSelectAll}
              >
                {t.selectAll}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:bg-muted/50"
                onClick={handleClearAll}
              >
                {t.clearAll}
              </Button>
            </div>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-[#E8E6E0]/70 bg-[#F9F8F5]/40 p-2">
            {targetDays.map((day) => {
              const checked = selected.has(day.weekday)
              return (
                <label
                  key={day.weekday}
                  htmlFor={`copy-target-${day.weekday}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                    checked ? "bg-white shadow-sm" : "hover:bg-white/60",
                  )}
                >
                  <Checkbox
                    id={`copy-target-${day.weekday}`}
                    checked={checked}
                    onCheckedChange={() => toggleDay(day.weekday)}
                    className="border-[#1A5345] data-[state=checked]:bg-[#1A5345] data-[state=checked]:text-white"
                  />
                  <Label
                    htmlFor={`copy-target-${day.weekday}`}
                    className="cursor-pointer text-[12px] font-medium text-[#1A1F1E]"
                  >
                    {localizedWeekday(day)}
                  </Label>
                </label>
              )
            })}
          </div>
        </div>

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] hover:bg-slate-50"
            onClick={() => onOpenChange(false)}
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            className="h-9 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
            onClick={handleCopy}
          >
            <CopyIcon className="size-3.5" aria-hidden />
            {t.copy}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
