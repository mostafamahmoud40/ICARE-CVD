import type { DayOption, TimeSlot } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StepHeading } from "./shared"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  InfoIcon,
} from "lucide-react"

type MonthNavProps = {
  label: string
  className?: string
}

function MonthNav({ label, className }: MonthNavProps) {
  return (
    <div className={cn("flex items-center gap-1 rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] px-1 py-1", className)}>
      <button type="button" className="flex items-center justify-center rounded-md p-1 text-[#6B7870] hover:bg-white">
        <ChevronLeftIcon className="size-[18px]" />
      </button>
      <span className="px-2 text-[13px] font-semibold">{label}</span>
      <button type="button" className="flex items-center justify-center rounded-md p-1 text-[#6B7870] hover:bg-white">
        <ChevronRightIcon className="size-[18px]" />
      </button>
    </div>
  )
}

type DayButtonProps = {
  day: string
  date: number
  disabled?: boolean
  active: boolean
  onSelect: () => void
}

function DayButton({ day, date, disabled, active, onSelect }: DayButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex size-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl transition-all",
        active
          ? "scale-105 bg-[#00392D] text-white shadow-[0_4px_16px_rgba(0,57,45,0.25)]"
          : disabled
            ? "cursor-not-allowed border border-[#E8E6E0] bg-transparent text-[#9CA3AF] opacity-60"
            : "cursor-pointer border border-[#E8E6E0] bg-white text-[#1A1F1E] hover:border-[#A8C4BC]",
      )}
    >
      <span className="text-[11px] font-medium">{day}</span>
      <span className="text-xl font-bold">{date}</span>
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
          ? "border-2 border-[#00392D] bg-[#E8F0EE] font-bold text-[#00392D]"
          : slot.available
            ? "cursor-pointer border border-[#E8E6E0] bg-white font-medium text-[#1A1F1E] hover:border-[#A8C4BC]"
            : "cursor-not-allowed border border-[#E8E6E0] bg-[#F9F8F5] font-medium text-[#9CA3AF]",
      )}
    >
      {active && slot.recommended && (
        <div className="absolute -right-2 -top-2 flex size-[18px] items-center justify-center rounded-full bg-[#00392D] text-white">
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
        <h4 className="m-0 mb-1 text-[13px] font-semibold text-[#00392D]">{title}</h4>
        <p className="m-0 text-[12px] leading-relaxed text-[#00392D]/85">{body}</p>
      </div>
    </div>
  )
}

type DateTimePickerProps = {
  days: DayOption[]
  timeSlots: TimeSlot[]
  monthLabel: string
  selectedDate: number
  selectedSlot: string
  onDateChange: (d: number) => void
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
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E8E6E0] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <div className="mb-5 flex items-center justify-between">
        <StepHeading step={2} title="Select Date & Time" />
        <MonthNav label={monthLabel} />
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        {days.map(({ day, date, disabled }) => (
          <DayButton
            key={date}
            day={day}
            date={date}
            disabled={disabled}
            active={selectedDate === date && !disabled}
            onSelect={() => onDateChange(date)}
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
