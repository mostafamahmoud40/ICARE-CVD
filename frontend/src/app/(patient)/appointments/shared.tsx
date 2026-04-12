import type { AppointmentStatus } from "./appointments.types"
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

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: "bg-[#E8F0EE] text-[#00392D] border border-[#A8C4BC]",
  confirmed: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  completed: "bg-[#EEF2EF] text-[#738678] border border-[#E8E6E0]",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
}

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  )
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
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0EE] text-[13px] font-bold text-[#C5A97B]">
        {step}
      </span>
      <h3 className="m-0 text-[17px] font-semibold text-[#1A1F1E]">{title}</h3>
    </div>
  )
}
