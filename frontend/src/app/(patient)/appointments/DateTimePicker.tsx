"use client"

import { useState } from "react"
import type { DayOption, TimeSlot } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StepHeading, appointmentsBookingCardClassName } from "./shared"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  InfoIcon,
  CalendarIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type MonthNavProps = {
  label: string
  selectedDate: Date | undefined
  onDateSelect: (date: Date) => void
  className?: string
}

function MonthNav({ label, selectedDate, onDateSelect, className }: MonthNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-lg border border-[#cfd9d5] bg-white px-3 py-2 text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0 transition-colors",
            className
          )}
        >
          <CalendarIcon className="size-4" />
          <span className="text-[13px] font-semibold">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onDateSelect(date)
              setOpen(false)
            }
          }}
          className="rounded-lg border-[#cfd9d5]"
          classNames={{
            months: "flex flex-col",
            month: "flex flex-col gap-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-[13px] font-semibold text-[#152a24]",
            nav: "flex items-center gap-1",
            nav_button: cn(
              "flex items-center justify-center rounded-md p-1 text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] transition-colors"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-[11px] font-medium text-[#6B7870] w-8",
            row: "flex w-full",
            cell: cn(
              "relative p-0 text-center text-[13px] focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#1A5345] [&:has([aria-selected])]:text-white [&:has([aria-selected].day-outside)]:bg-[#1A5345]/50",
              "hover:bg-[#d9e5e1] hover:text-[#1a5345]"
            ),
            day: cn(
              "h-10 w-10 p-0 font-normal transition-colors",
              "text-[#152a24]",
              "hover:bg-[#d9e5e1] hover:text-[#1a5345]"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-[#1A5345] text-white hover:bg-[#1A5345] hover:text-white",
            day_today: "bg-[#E8F0EE] text-[#1A5345] font-bold",
            day_outside:
              "text-[#9CA3AF] opacity-50",
            day_disabled: "text-[#9CA3AF] opacity-50 cursor-not-allowed",
            day_range_middle:
              "aria-selected:bg-[#E8F0EE] aria-selected:text-[#1A5345]",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

type DayButtonProps = {
  day: string
  date: number
  label?: string
  disabled?: boolean
  active: boolean
  onSelect: () => void
}

function DayButton({ day, date, label, disabled, active, onSelect }: DayButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex size-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl transition-all",
        active
          ? "scale-105 bg-[#1A5345] text-white shadow-[0_4px_16px_rgba(0,57,45,0.25)]"
          : disabled
            ? "cursor-not-allowed border border-[#E8E6E0] bg-transparent text-[#9CA3AF] opacity-60"
            : "cursor-pointer border border-[#E8E6E0] bg-white text-[#1A1F1E] hover:border-[#A8C4BC]",
      )}
    >
      <span className="text-[11px] font-medium">{day}</span>
      <span className="text-xl font-bold">{date}</span>
      {label ? <span className="text-[10px] font-medium">{label}</span> : null}
      {active && <div className="absolute -bottom-1 size-1 rounded-full bg-white" />}
    </button>
  )
}

type SlotButtonProps = {
  slot: TimeSlot
  active: boolean
  onSelect: () => void
}

function SlotButton({ slot, active, onSelect }: SlotButtonProps) {
  return (
    <button
      type="button"
      disabled={!slot.available}
      onClick={onSelect}
      className={cn(
        "relative rounded-lg p-3 text-center text-[13px] transition-all",
        active
          ? "border-2 border-[#1A5345] bg-[#E8F0EE] font-bold text-[#1A5345]"
          : slot.available
            ? "cursor-pointer border border-[#E8E6E0] bg-white font-medium text-[#1A1F1E] hover:border-[#A8C4BC]"
            : "cursor-not-allowed border border-[#E8E6E0] bg-[#F9F8F5] font-medium text-[#9CA3AF]",
      )}
    >
      {active && slot.recommended && (
        <div className="absolute -right-2 -top-2 flex size-[18px] items-center justify-center rounded-full bg-[#1A5345] text-white">
          <CheckIcon className="size-3" />
        </div>
      )}
      <div>{slot.time}</div>
      {slot.label && (
        <div className={cn("mt-0.5 text-[10px] font-normal", active ? "text-[#C5A97B]" : "text-[#9CA3AF]")}>
          {slot.label}
        </div>
      )}
    </button>
  )
}

type AiTipBoxProps = {
  title: string
  body: string
  className?: string
}

function AiTipBox({ title, body, className }: AiTipBoxProps) {
  return (
    <div className={cn("mt-6 flex items-start gap-4 rounded-xl border border-[#A8C4BC] bg-[#E8F0EE] p-4", className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] text-[#C5A97B]">
        <InfoIcon className="size-5" />
      </div>
      <div>
        <h4 className="m-0 mb-1 text-[13px] font-semibold text-[#1A5345]">{title}</h4>
        <p className="m-0 text-[12px] leading-relaxed text-[#1A5345]/85">{body}</p>
      </div>
    </div>
  )
}

type DateTimePickerProps = {
  days: DayOption[]
  timeSlots: TimeSlot[]
  monthLabel: string
  selectedDate: string
  selectedSlot: string
  onDateChange: (d: string) => void
  onSlotChange: (s: string) => void
  aiTipTitle: string
  aiTipBody: string
  className?: string
}

export function DateTimePicker({
  days,
  timeSlots,
  monthLabel,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotChange,
  aiTipTitle,
  aiTipBody,
  className,
}: DateTimePickerProps) {
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined
  )

  const handleCalendarSelect = (date: Date) => {
    setCalendarDate(date)
    onDateChange(date.toISOString().slice(0, 10))
  }

  return (
    <div className={cn(appointmentsBookingCardClassName, className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StepHeading step={3} title="Select date & time" className="mb-0" />
        <MonthNav 
          label={monthLabel} 
          selectedDate={calendarDate}
          onDateSelect={handleCalendarSelect}
        />
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {days.map(({ day, date, fullDate, label, disabled }) => (
          <DayButton
            key={fullDate}
            day={day}
            date={date}
            label={label}
            disabled={disabled}
            active={selectedDate === fullDate && !disabled}
            onSelect={() => onDateChange(fullDate)}
          />
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6B7870]">
            Available Slots
          </span>
          <div className="h-px flex-1 bg-[#E8E6E0]" />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {timeSlots.map((slot) => (
            <SlotButton
              key={slot.time}
              slot={slot}
              active={selectedSlot === slot.time && slot.available}
              onSelect={() => onSlotChange(slot.time)}
            />
          ))}
        </div>
      </div>

      <AiTipBox title={aiTipTitle} body={aiTipBody} />
    </div>
  )
}
