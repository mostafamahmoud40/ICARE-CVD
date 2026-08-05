"use client"

import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getDefaultClassNames } from "react-day-picker"

type AppointmentCalendarGridProps = {
  appointmentDays: Set<string>
  selectedDate: Date | undefined
  onSelectDate: (date: Date) => void
}

function CalendarDayWithDots({
  appointmentDays,
  day,
  modifiers,
  className,
  children,
  ...props
}: {
  appointmentDays: Set<string>
  day: { date: Date }
  modifiers: { selected?: boolean; range_start?: boolean; range_end?: boolean; range_middle?: boolean }
  className?: string
  children?: React.ReactNode
} & Omit<React.ComponentProps<typeof Button>, "ref">) {
  const defaultClassNames = getDefaultClassNames()
  const dateKey = format(day.date, "yyyy-MM-dd")
  const hasAppointments = appointmentDays.has(dateKey)

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-[#1A5345] data-[selected-single=true]:text-white dark:hover:text-accent-foreground",
        defaultClassNames.day,
        className,
      )}
      {...props}
    >
      {children}
      {hasAppointments && (
        <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2">
          <span className="block size-1.5 rounded-full bg-[#1A5345]" />
        </span>
      )}
    </Button>
  )
}

export function AppointmentCalendarGrid({
  appointmentDays,
  selectedDate,
  onSelectDate,
}: AppointmentCalendarGridProps) {
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => date && onSelectDate(date)}
      components={{
        DayButton: (dayButtonProps) => (
          <CalendarDayWithDots
            appointmentDays={appointmentDays}
            day={dayButtonProps.day}
            modifiers={dayButtonProps.modifiers}
            className={dayButtonProps.className}
            children={dayButtonProps.children}
            onClick={dayButtonProps.onClick}
            disabled={dayButtonProps.disabled}
          />
        ),
      }}
      className="rounded-xl border border-[#E5EEEA] bg-white"
    />
  )
}
