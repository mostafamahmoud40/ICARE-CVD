"use client"

import { useState, useMemo } from "react"
import type { DoctorAppointment, FilterTab, AppointmentStats } from "./doctorAppointments.types"
import { cn } from "@/lib/utils"
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  SearchIcon,
  StethoscopeIcon,
  XCircleIcon,
  XIcon,
  VideoIcon,
  Building2Icon,
  ChevronRightIcon,
  RefreshCwIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-[#F6EFE4] text-[#9A6B2F] border border-[#E9D9BF]",
  confirmed: "bg-[#E8F0EE] text-[#1A5345] border border-[#A8C4BC]",
  completed: "bg-[#EEF2EF] text-[#738678] border border-[#DDE5E0]",
  cancelled: "bg-red-50 text-red-500 border border-red-200",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.scheduled,
      )}
    >
      {status}
    </span>
  )
}

type StatCardProps = {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5EEEA] bg-[#FBFDFC] p-3">
      <div className={cn("flex size-9 items-center justify-center rounded-lg", accent)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-[#102F27]">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

type AppointmentRowProps = {
  appointment: DoctorAppointment
  onClick: () => void
  isPast?: boolean
  isCancelled?: boolean
}

function AppointmentRow({ appointment, onClick, isPast, isCancelled }: AppointmentRowProps) {
  const date = new Date(appointment.scheduledAt)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const isVirtual = appointment.visitType === "virtual"

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center gap-2 border-b border-[#E8E6E0] px-3 py-3 transition-colors hover:bg-[#F9F8F5] lg:gap-3 lg:px-4",
        isPast && "opacity-70",
        isCancelled && "opacity-50",
      )}
    >
      {/* Confirmation Code */}
      <div className="w-[88px] shrink-0 text-center lg:w-[104px]">
        <p className="font-mono text-[12px] font-medium text-[#1A5345]">
          {appointment.confirmationCode}
        </p>
      </div>

      {/* Visit Type Icon */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          isVirtual ? "bg-violet-50" : "bg-[#E8F0EE]",
        )}
      >
        {isVirtual ? (
          <VideoIcon className="size-5 text-violet-500" />
        ) : (
          <Building2Icon className="size-5 text-[#1A5345]" />
        )}
      </div>

      {/* Date Column */}
      <div className="w-[56px] shrink-0 text-center lg:w-[64px]">
        <p
          className={cn(
            "text-[11px] font-medium uppercase",
            isToday ? "text-emerald-600" : "text-[#6B7870]",
          )}
        >
          {isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short" })}
        </p>
        <p className="text-lg font-bold text-[#1A1F1E]">{date.getDate()}</p>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Patient Name */}
          <div className="w-[120px] shrink-0 lg:w-[140px]">
            <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
              {appointment.patient.name}
            </p>
            <p className="truncate text-[11px] text-[#6B7870]">
              {appointment.patient.age != null ? `${appointment.patient.age}y, ` : ""}{appointment.patient.gender}
            </p>
          </div>

          {/* Visit Type Badge */}
          <div className="w-[72px] shrink-0 lg:w-[80px]">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                isVirtual
                  ? "bg-violet-50 text-violet-600 border border-violet-200"
                  : "bg-[#E8F0EE] text-[#1A5345] border border-[#A8C4BC]",
              )}
            >
              {isVirtual ? (
                <VideoIcon className="size-3" />
              ) : (
                <Building2Icon className="size-3" />
              )}
              {isVirtual ? "Virtual" : "In-Clinic"}
            </span>
          </div>

          {/* Time */}
          <div className="w-[84px] shrink-0 lg:w-[96px]">
            <span className="flex items-center gap-1 text-[13px] text-[#1A1F1E]">
              <ClockIcon className="size-3.5 text-[#6B7870]" />
              {formatTimeOnly(appointment.scheduledAt)}
            </span>
          </div>

          {/* Reason */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[#1A1F1E]">
              {appointment.reason}
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="w-[64px] shrink-0 text-center lg:w-[76px]">
        <StatusBadge status={appointment.status} />
      </div>

      {/* Arrow */}
      <div className="w-3 shrink-0">
        <ChevronRightIcon className="size-4 text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

type AppointmentListProps = {
  appointments: DoctorAppointment[]
  stats: AppointmentStats
  onSelectAppointment: (appointment: DoctorAppointment) => void
  className?: string
}

export function AppointmentList({
  appointments,
  stats,
  onSelectAppointment,
  className,
}: AppointmentListProps) {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    let filtered = appointments

    switch (filter) {
      case "today":
        filtered = appointments.filter(
          (a) =>
            new Date(a.scheduledAt) >= todayStart &&
            new Date(a.scheduledAt) < todayEnd &&
            a.status !== "cancelled",
        )
        break
      case "upcoming":
        filtered = appointments.filter(
          (a) => new Date(a.scheduledAt) > now && a.status !== "cancelled" && a.status !== "completed",
        )
        break
      case "completed":
        filtered = appointments.filter((a) => a.status === "completed")
        break
      case "cancelled":
        filtered = appointments.filter((a) => a.status === "cancelled")
        break
      default:
        filtered = appointments
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.patient.name.toLowerCase().includes(q) ||
          a.confirmationCode.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q),
      )
    }

    return filtered
  }, [appointments, filter, searchQuery])

  return (
    <TooltipProvider>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className={cn("w-full overflow-hidden bg-white", className)}>
        {/* Header */}
        <div className="border-b border-[#E8E6E0] bg-[#FAFAF8] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#1A5345]">
                <StethoscopeIcon className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[#1A1F1E]">My Appointments</h2>
                <p className="text-[11px] text-[#6B7870]">
                  {stats.today} today &middot; {stats.upcoming} upcoming &middot; {stats.cancelled} cancelled
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard
              icon={<CalendarDaysIcon className="size-4 text-[#1A5345]" />}
              label="Today"
              value={stats.today}
              accent="bg-[#E8F0EE]"
            />
            <StatCard
              icon={<ClockIcon className="size-4 text-[#C26D2A]" />}
              label="Upcoming"
              value={stats.upcoming}
              accent="bg-[#F9F2E8]"
            />
            <StatCard
              icon={<CheckCircle2Icon className="size-4 text-[#2E8B68]" />}
              label="Completed"
              value={stats.completed}
              accent="bg-[#F4F9F7]"
            />
            <StatCard
              icon={<XCircleIcon className="size-4 text-red-500" />}
              label="Cancelled"
              value={stats.cancelled}
              accent="bg-red-50"
            />
          </div>

          {/* Search + Filter Tabs */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-80 lg:w-96">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient, code, or reason..."
                className="h-8 border-[#E8E6E0] bg-white pl-9 text-[13px] placeholder:text-[#9CA3AF]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
            <div className="w-full overflow-x-auto no-scrollbar md:ml-auto md:w-auto">
              <div className="flex min-w-max gap-1">
                {(["all", "today", "upcoming", "completed", "cancelled"] as FilterTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                        filter === tab
                          ? "bg-[#1A5345] text-white"
                          : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]",
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center gap-2 border-b border-[#E8E6E0] bg-[#F9F8F5] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7870] lg:gap-3 lg:px-4">
          <div className="w-[88px] shrink-0 text-center lg:w-[104px]">Code</div>
          <div className="flex size-10 shrink-0 items-center justify-center">Type</div>
          <div className="w-[56px] shrink-0 text-center lg:w-[64px]">Date</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="w-[120px] lg:w-[140px]">Patient</span>
              <span className="w-[72px] lg:w-[80px]">Visit</span>
              <span className="w-[84px] lg:w-[96px]">Time</span>
              <span className="flex-1">Reason</span>
            </div>
          </div>
          <div className="w-[64px] text-center lg:w-[76px]">Status</div>
          <div className="w-3 shrink-0" />
        </div>

        {/* Rows */}
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
              <CalendarDaysIcon className="size-7 text-[#9CA3AF]" />
            </div>
            <p className="text-[14px] text-[#6B7870]">
              {searchQuery
                ? "No appointments match your search."
                : "No appointments found for this filter."}
            </p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => {
            const now = new Date()
            const isPast =
              new Date(appointment.scheduledAt) < now && appointment.status !== "cancelled"
            const isCancelled = appointment.status === "cancelled"

            return (
              <AppointmentRow
                key={appointment.id}
                appointment={appointment}
                isPast={isPast}
                isCancelled={isCancelled}
                onClick={() => onSelectAppointment(appointment)}
              />
            )
          })
        )}
      </div>
    </TooltipProvider>
  )
}
