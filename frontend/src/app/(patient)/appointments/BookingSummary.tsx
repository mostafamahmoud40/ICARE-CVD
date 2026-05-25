import type { FeeRow } from "./appointments.types"
import { cn } from "@/lib/utils"
import { LucideIcon } from "./shared"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowRightIcon,
  SparklesIcon,
  StethoscopeIcon,
} from "lucide-react"
import { computeFeeTotal } from "./appointments.utils"

type SummaryRowProps = {
  icon: React.ReactNode
  primary: string
  secondary?: string
  className?: string
}

function SummaryRow({ icon, primary, secondary, className }: SummaryRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="shrink-0 text-[#1A5345]">{icon}</div>
      <div>
        <p className="m-0 text-[13px] font-medium text-[#1A1F1E]">
          {primary}
          {secondary ? <span className="text-muted-foreground"> {secondary}</span> : null}
        </p>
      </div>
    </div>
  )
}

type FeeBreakdownProps = {
  fees: FeeRow[]
}

function FeeBreakdown({ fees }: FeeBreakdownProps) {
  const total = computeFeeTotal(fees)
  return (
    <div className="mb-5 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4">
      <div className="flex flex-col gap-2">
        {fees.map((row, i) => (
          <div
            key={i}
            className={cn(
              "flex justify-between text-[13px] font-medium",
              row.highlight ? "text-[#1A5345]" : "text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-1.5">
              {row.icon ? <LucideIcon name={row.icon} className="size-3.5 text-[#1A5345]" /> : null}
              {row.label}
            </span>
            <span className="tabular-nums">{row.amount}</span>
          </div>
        ))}
        <Separator className="my-2 bg-[#E8E6E0]/60" />
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#1A1F1E]">Est. pay</span>
          <span className="text-[20px] font-bold tabular-nums text-[#1A1F1E]">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

type BookingSummaryProps = {
  doctorName: string
  selectedDate: string
  selectedSlot: string
  fees: FeeRow[]
  onConfirm: () => void
  className?: string
}

export function BookingSummary({
  doctorName,
  selectedDate,
  selectedSlot,
  fees,
  onConfirm,
  className,
}: BookingSummaryProps) {
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Select a date"

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] xl:sticky xl:top-4",
        className,
      )}
    >
      <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
        <h3 className="font-serif text-[17px] font-bold leading-tight text-[#1A1F1E] sm:text-[18px]">
          Booking summary
        </h3>
        <p className="mt-0.5 text-[12px] font-medium text-muted-foreground sm:text-[13px]">
          Review details before confirming
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3 border-b border-[#E8E6E0]/60 pb-5">
          <StethoscopeIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
          <div>
            <p className="m-0 font-serif text-[15px] font-bold text-[#1A1F1E]">{doctorName}</p>
            <p className="m-0 text-[12px] font-medium text-muted-foreground">Cardiology</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <SummaryRow icon={<CalendarIcon className="size-4" />} primary={selectedDateLabel} />
          <SummaryRow
            icon={<ClockIcon className="size-4" />}
            primary={selectedSlot || "Select a time"}
            secondary={selectedSlot ? "(30 min)" : undefined}
          />
          <SummaryRow
            icon={<SparklesIcon className="size-4 text-violet-600" />}
            primary="Low wait time anticipated"
            className="[&_p]:text-violet-700"
          />
          <div className="flex items-start gap-3">
            <MapPinIcon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
            <div>
              <p className="m-0 text-[13px] font-medium text-[#1A1F1E]">Downtown Heart Center</p>
              <p className="m-0 text-[11px] font-medium text-muted-foreground">Building B, Suite 402</p>
            </div>
          </div>
        </div>

        <FeeBreakdown fees={fees} />

        <Button
          type="button"
          onClick={onConfirm}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#1A5345] text-[13px] font-bold text-white shadow-sm hover:bg-[#133F34]"
        >
          Confirm appointment
          <ArrowRightIcon className="size-4" aria-hidden />
        </Button>

        <p className="mt-3 text-center text-[10px] font-medium text-muted-foreground">
          By booking, you agree to our{" "}
          <a href="#" className="font-bold text-[#1A5345] underline-offset-2 hover:underline">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  )
}
