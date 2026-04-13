import type { FeeRow } from "./appointments.types"
import { cn } from "@/lib/utils"
import { LucideIcon } from "./shared"
import { Separator } from "@/components/ui/separator"
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  MapPinIcon,
  ArrowRightIcon,
  PersonStandingIcon,
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
      <div className="shrink-0 text-[#6B7870]">{icon}</div>
      <div>
        <p className="m-0 text-[13px] font-medium text-[#1A1F1E]">
          {primary}
          {secondary && <span className="text-[#6B7870]"> {secondary}</span>}
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
    <div className="mb-5 rounded-lg bg-[#F9F8F5] p-4">
      <div className="flex flex-col gap-2">
        {fees.map((row, i) => (
          <div
            key={i}
            className={cn(
              "flex justify-between text-[13px]",
              row.highlight ? "text-[#738678]" : "text-[#6B7870]",
            )}
          >
            <span className="flex items-center gap-1">
              {row.icon && <LucideIcon name={row.icon} className="size-3.5" />}
              {row.label}
            </span>
            <span>{row.amount}</span>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#1A1F1E]">Est. Pay</span>
          <span className="text-[22px] font-bold text-[#1A1F1E]">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

type BookingSummaryProps = {
  doctorName: string
  selectedDate: number
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
  return (
    <div
      className={cn(
        "sticky top-6 overflow-hidden rounded-2xl border border-[#E8E6E0] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.09)]",
        className,
      )}
    >
      <div className="bg-[#00392D] px-6 py-4 text-white">
        <h3 className="m-0 text-[15px] font-semibold">Booking Summary</h3>
      </div>

      <div className="p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-[#E8E6E0] pb-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-200">
            <PersonStandingIcon className="size-6 text-slate-400" />
          </div>
          <div>
            <p className="m-0 text-[13px] font-bold text-[#1A1F1E]">{doctorName}</p>
            <p className="m-0 text-[12px] text-[#6B7870]">Cardiology</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <SummaryRow
            icon={<CalendarIcon className="size-5" />}
            primary={`Tue, Oct ${selectedDate}, 2023`}
          />
          <SummaryRow
            icon={<ClockIcon className="size-5" />}
            primary={selectedSlot}
            secondary="(30 min)"
          />
          <SummaryRow
            icon={<CheckCircleIcon className="size-5 fill-[#C5A97B] text-[#C5A97B]" />}
            primary="Low wait time anticipated"
            className="[&_p]:text-[#C5A97B]"
          />
          <div className="flex items-start gap-3">
            <MapPinIcon className="size-5 shrink-0 text-[#6B7870]" />
            <div>
              <p className="m-0 text-[13px] font-medium text-[#1A1F1E]">Downtown Heart Center</p>
              <p className="m-0 text-[11px] text-[#6B7870]">Building B, Suite 402</p>
            </div>
          </div>
        </div>

        <FeeBreakdown fees={fees} />

        <button
          type="button"
          onClick={onConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00392D] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,57,45,0.3)] transition-colors hover:bg-[#002620]"
        >
          Confirm Appointment
          <ArrowRightIcon className="size-[18px]" />
        </button>

        <p className="mt-3 text-center text-[10px] text-[#6B7870]">
          By booking, you agree to our{" "}
          <a href="#" className="text-[#00392D] underline">
            Terms of Service
          </a>
          .
        </p>
      </div>
    </div>
  )
}
