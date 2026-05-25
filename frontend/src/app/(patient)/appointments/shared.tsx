import type {
  AppointmentBookingStatus,
  AppointmentCancelledBy,
} from "./appointments.types"
import { cn } from "@/lib/utils"
import {
  HeartIcon,
  ActivityIcon,
  Building2Icon,
  VideoIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  UserIcon,
  CalendarDaysIcon,
} from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  heart: HeartIcon,
  activity: ActivityIcon,
  shield: ShieldCheckIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  "map-pin": MapPinIcon,
  "check-circle": CheckCircleIcon,
  user: UserIcon,
  building: Building2Icon,
  video: VideoIcon,
}

export function LucideIcon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] ?? CalendarDaysIcon
  return <Comp className={className ?? "size-4"} />
}

const STATUS_STYLES: Record<AppointmentBookingStatus, string> = {
  upcoming: "bg-[#3B82F6] text-white",
  completed: "bg-[#6B7870] text-white",
  cancelled: "bg-rose-500 text-white",
  "no-show": "bg-red-600 text-white",
  rescheduled: "bg-amber-500 text-white",
}

const STATUS_LABELS: Record<AppointmentBookingStatus, string> = {
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No show",
  rescheduled: "Rescheduled",
}

export const CANCELLED_BY_LABELS: Record<AppointmentCancelledBy, string> = {
  patient: "Cancelled by you",
  doctor: "Cancelled by doctor",
  clinic: "Cancelled by clinic",
}

export const CANCELLED_BY_DESCRIPTIONS: Record<AppointmentCancelledBy, string> = {
  patient: "You cancelled this booking from your account.",
  doctor: "Your clinician cancelled this appointment.",
  clinic: "The clinic team cancelled this booking (e.g. schedule change or closure).",
}

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentBookingStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

/** Toolbar search — styled for the appointments list header. */
export const appointmentsListSearchInputClassName =
  "h-10 w-full rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] pl-10 pr-4 text-[13px] font-medium text-[#1A1F1E] shadow-none transition-[border-color,background-color,box-shadow] placeholder:font-medium placeholder:text-muted-foreground/55 focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-11 sm:pl-11 sm:text-[14px]";

/** Shared card surface for booking flow sections. */
export const appointmentsBookingCardClassName =
  "rounded-2xl border border-[#E8E6E0]/70 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] sm:p-6";

export function appointmentsScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
}

export function StepHeading({
  step,
  title,
  className,
}: {
  step: number
  title: string
  className?: string
}) {
  return (
    <div className={cn("mb-5 flex items-center gap-3", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] text-[13px] font-bold text-[#1A5345]">
        {step}
      </span>
      <h3 className="m-0 font-serif text-[17px] font-semibold text-[#1A1F1E]">{title}</h3>
    </div>
  )
}
