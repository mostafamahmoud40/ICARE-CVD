"use client"

import { useState, useMemo, useEffect } from "react"
import type { Appointment, FilterTab } from "./appointments.types"
import { cn } from "@/lib/utils"
import {
  StatusBadge,
  LucideIcon,
  appointmentsListSearchInputClassName,
  appointmentsScrollbarCss,
} from "./shared"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PatientAvatar } from "@/components/shared/PatientAvatar"
import {
  CalendarIcon,
  CalendarDaysIcon,
  SearchIcon,
  CalendarClockIcon,
  Trash2Icon,
  FileTextIcon,
} from "lucide-react"
import {
  APPOINTMENTS_LIST_PAGE_SIZE,
  formatTimeOnly,
  getAppointmentBookingDisplayStatus,
  isAppointmentManageable,
  sortAppointmentsByScheduledAtDesc,
} from "./appointments.utils"
import { AppointmentDetailDialog } from "./AppointmentDetailDialog"
import { AppointmentsListPagination } from "./AppointmentsListPagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function getVisitTypeIcon(location: string, visitType?: string): string {
  if (
    visitType === "virtual" ||
    location.toLowerCase().includes("virtual") ||
    location.toLowerCase().includes("video")
  ) {
    return "video"
  }
  return "building"
}

function getVisitTypeLabel(location: string, visitType?: string): string {
  if (
    visitType === "virtual" ||
    location.toLowerCase().includes("virtual") ||
    location.toLowerCase().includes("video")
  ) {
    return "Virtual"
  }
  return "In clinic"
}

type AppointmentTableRowProps = {
  appointment: Appointment
  isPast?: boolean
  isCancelled?: boolean
  onSelect: () => void
  onReschedule: () => void
  onCancel: () => void
}

function AppointmentTableRow({
  appointment,
  isPast,
  isCancelled,
  onSelect,
  onReschedule,
  onCancel,
}: AppointmentTableRowProps) {
  const visitTypeIcon = getVisitTypeIcon(appointment.location, appointment.visitType)
  const visitTypeLabel = getVisitTypeLabel(appointment.location, appointment.visitType)
  const date = new Date(appointment.scheduledAt)
  const isToday = new Date().toDateString() === date.toDateString()
  const displayStatus = getAppointmentBookingDisplayStatus(appointment)
  const canManage = isAppointmentManageable(appointment.status)

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50",
        isPast && "opacity-70",
        isCancelled && "opacity-50",
      )}
    >
      <td className="py-4 pl-4 pr-4 align-middle">
        <p className="font-mono text-[12px] font-medium tabular-nums tracking-wide text-[#00392D]">
          {appointment.confirmationCode}
        </p>
      </td>
      <td className="px-4 py-4 align-middle">
        <p
          className={cn(
            "text-[11px] font-bold uppercase tracking-wide",
            isToday ? "text-emerald-600" : "text-muted-foreground",
          )}
        >
          {isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short" })}
        </p>
        <p className="text-[18px] font-bold tabular-nums leading-none text-[#1A1F1E]">{date.getDate()}</p>
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
            <PatientAvatar
              name={appointment.clinician}
              avatarUrl={appointment.clinicianAvatarUrl}
              sizes="44px"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {appointment.clinician}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground">
              {appointment.department}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-middle">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1A1F1E]/80",
            visitTypeIcon === "video" && "text-violet-700",
          )}
        >
          <LucideIcon
            name={visitTypeIcon}
            className={cn(
              "size-4 shrink-0",
              visitTypeIcon === "video" ? "text-violet-600" : "text-[#1A5345]",
            )}
          />
          {visitTypeLabel}
        </span>
      </td>
      <td className="px-4 py-4 align-middle">
        <p className="text-[14px] font-bold tabular-nums text-[#1A1F1E]">
          {formatTimeOnly(appointment.scheduledAt)}
        </p>
        {displayStatus === "upcoming" || displayStatus === "rescheduled" ? (
          <p className="mt-0.5 text-[11px] font-bold text-emerald-600">
            {displayStatus === "rescheduled" ? "New slot" : "Scheduled"}
          </p>
        ) : displayStatus === "completed" || displayStatus === "no-show" ? (
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Ended</p>
        ) : null}
      </td>
      <td className="max-w-[220px] px-4 py-4 align-middle">
        <p className="truncate text-[14px] font-medium text-[#1A1F1E]/80">
          {appointment.reason?.trim() || appointment.department}
        </p>
      </td>
      <td className="px-4 py-4 align-middle">
        <StatusBadge status={displayStatus} />
      </td>
      <td className="px-4 py-4 align-middle">
        <div className="flex items-center justify-end gap-0.5">
          {appointment.status === "completed" && displayStatus === "completed" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="View report"
              aria-label="View report"
              className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
              onClick={(e) => e.stopPropagation()}
            >
              <FileTextIcon className="size-4" strokeWidth={2.5} />
            </Button>
          ) : canManage && !isCancelled ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Reschedule"
                aria-label="Reschedule"
                className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-[#1A5345]"
                onClick={(e) => {
                  e.stopPropagation()
                  onReschedule()
                }}
              >
                <CalendarClockIcon className="size-4" strokeWidth={2.5} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Cancel"
                aria-label="Cancel appointment"
                className="size-8 border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-rose-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel()
                }}
              >
                <Trash2Icon className="size-4" strokeWidth={2.2} />
              </Button>
            </>
          ) : (
            <span className="px-1 text-[11px] font-bold text-muted-foreground">—</span>
          )}
        </div>
      </td>
    </tr>
  )
}

type MyAppointmentsProps = {
  appointments: Appointment[]
  upcoming: Appointment[]
  past: Appointment[]
  onCancelAppointment: (appointmentId: string) => Promise<unknown>
  className?: string
}

const FILTER_SELECT_ALL = "__icare_filter_all__"

const STATUS_FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All appointments" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
]

const appointmentsFilterSelectTriggerClassName =
  "h-8 w-full rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-slate-50 focus:ring-0 sm:w-[140px]"

const appointmentsFilterSelectItemClassName =
  "h-10 cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345]"

export function MyAppointments({
  appointments,
  upcoming,
  past,
  onCancelAppointment,
  className,
}: MyAppointmentsProps) {
  const router = useRouter()
  const goToDoctorDirectory = () => router.push("/doctor-directory")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [doctorFilter, setDoctorFilter] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelledAppointments, setCancelledAppointments] = useState<string[]>([])

  const appointmentsView = useMemo(
    () =>
      appointments.map((a) =>
        cancelledAppointments.includes(a.id)
          ? {
              ...a,
              status: "cancelled" as const,
              cancelledBy: "patient" as const,
              cancellationReason:
                a.cancellationReason ?? "Cancelled from your account.",
              cancelledAt: a.cancelledAt ?? new Date().toISOString(),
            }
          : a,
      ),
    [appointments, cancelledAppointments],
  )

  const doctorOptions = useMemo(
    () =>
      [...new Set(appointmentsView.map((a) => a.clinician.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [appointmentsView],
  )

  const departmentOptions = useMemo(
    () =>
      [...new Set(appointmentsView.map((a) => a.department.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [appointmentsView],
  )

  const filteredAppointments = useMemo(() => {
    let filtered = appointmentsView

    if (filter === "upcoming") {
      filtered = appointmentsView.filter(
        (a) => a.status === "upcoming" || a.status === "rescheduled",
      )
    } else if (filter === "past") {
      filtered = appointmentsView.filter(
        (a) => a.status === "completed" || a.status === "no-show",
      )
    } else if (filter === "cancelled") {
      filtered = appointmentsView.filter((a) => a.status === "cancelled")
    }

    if (doctorFilter) {
      filtered = filtered.filter(
        (a) => a.clinician.trim().toLowerCase() === doctorFilter.toLowerCase(),
      )
    }

    if (departmentFilter) {
      filtered = filtered.filter(
        (a) => a.department.trim().toLowerCase() === departmentFilter.toLowerCase(),
      )
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.department.toLowerCase().includes(query) ||
          a.clinician.toLowerCase().includes(query) ||
          a.location.toLowerCase().includes(query) ||
          a.confirmationCode.toLowerCase().includes(query),
      )
    }

    return sortAppointmentsByScheduledAtDesc(filtered)
  }, [appointmentsView, filter, doctorFilter, departmentFilter, searchQuery])

  const hasActiveFilters =
    filter !== "all" || Boolean(doctorFilter) || Boolean(departmentFilter)

  const totalCount = filteredAppointments.length
  const totalPages = Math.max(1, Math.ceil(totalCount / APPOINTMENTS_LIST_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedAppointments = useMemo(() => {
    const start = (safePage - 1) * APPOINTMENTS_LIST_PAGE_SIZE
    return filteredAppointments.slice(start, start + APPOINTMENTS_LIST_PAGE_SIZE)
  }, [filteredAppointments, safePage])

  const rangeStart = totalCount === 0 ? 0 : (safePage - 1) * APPOINTMENTS_LIST_PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * APPOINTMENTS_LIST_PAGE_SIZE, totalCount)

  useEffect(() => {
    setPage(1)
  }, [filter, doctorFilter, departmentFilter, searchQuery])

  const handleCancel = async (id: string) => {
    try {
      await onCancelAppointment(id)
      setCancelledAppointments((prev) => [...prev, id])
      setSelectedAppointment(null)
    } catch {
      alert("Could not cancel appointment. Please try again.")
    }
  }

  const handleReschedule = () => {
    setSelectedAppointment(null)
    goToDoctorDirectory()
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500",
        className,
      )}
    >
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Appointments
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                My appointments
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                All your bookings — upcoming, completed, cancelled, and rescheduled.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="hidden flex-col items-end gap-0.5 xl:flex">
                <span className="text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                  Upcoming visits
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[16px] font-bold leading-none text-[#1A5345] tabular-nums sm:text-[17px]">
                    {upcoming.length}
                  </span>
                  <CalendarIcon className="size-5 shrink-0 text-[#1A5345]" aria-hidden />
                </div>
              </div>
              <Button
                type="button"
                asChild
                className="h-9 gap-2 rounded-xl border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
              >
                <Link href="/doctor-directory">
                  <CalendarIcon className="size-4" aria-hidden />
                  Book appointment
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            <div className="group relative w-full sm:min-w-0 sm:max-w-[min(100%,360px)] sm:flex-1 lg:max-w-[400px]">
              <SearchIcon
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#1A5345]/35 transition-colors group-focus-within:text-[#1A5345] sm:left-4"
                strokeWidth={2}
                aria-hidden
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clinician, department or code…"
                className={appointmentsListSearchInputClassName}
              />
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Select value={filter} onValueChange={(value) => setFilter(value as FilterTab)}>
                <SelectTrigger className={appointmentsFilterSelectTriggerClassName}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  {STATUS_FILTER_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className={appointmentsFilterSelectItemClassName}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={doctorFilter || FILTER_SELECT_ALL}
                onValueChange={(value) =>
                  setDoctorFilter(value === FILTER_SELECT_ALL ? "" : value)
                }
              >
                <SelectTrigger className={appointmentsFilterSelectTriggerClassName}>
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value={FILTER_SELECT_ALL} className={appointmentsFilterSelectItemClassName}>
                    All doctors
                  </SelectItem>
                  {doctorOptions.map((doctor) => (
                    <SelectItem key={doctor} value={doctor} className={appointmentsFilterSelectItemClassName}>
                      {doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter || FILTER_SELECT_ALL}
                onValueChange={(value) =>
                  setDepartmentFilter(value === FILTER_SELECT_ALL ? "" : value)
                }
              >
                <SelectTrigger className={appointmentsFilterSelectTriggerClassName}>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-[#cfd9d5] bg-white shadow-lg">
                  <SelectItem value={FILTER_SELECT_ALL} className={appointmentsFilterSelectItemClassName}>
                    All departments
                  </SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem
                      key={department}
                      value={department}
                      className={appointmentsFilterSelectItemClassName}
                    >
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                    <th className="py-4 pl-4 pr-4">Code</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Doctor</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-4 py-4">Time</th>
                    <th className="px-4 py-4">Reason</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td className="px-4 py-20 text-center" colSpan={8}>
                        <EmptyState
                          message={
                            searchQuery
                              ? "No appointments match your search."
                              : hasActiveFilters
                                ? "No appointments match your filters."
                                : "No appointments found. Book your first visit!"
                          }
                          showBookLink={!searchQuery && !hasActiveFilters}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedAppointments.map((appointment) => {
                      const displayStatus = getAppointmentBookingDisplayStatus(appointment)
                      const isPast =
                        displayStatus === "completed" || displayStatus === "no-show"
                      const isCancelled = appointment.status === "cancelled"

                      return (
                        <AppointmentTableRow
                          key={appointment.id}
                          appointment={appointment}
                          isPast={isPast}
                          isCancelled={isCancelled}
                          onSelect={() => setSelectedAppointment(appointment)}
                          onReschedule={handleReschedule}
                          onCancel={() => void handleCancel(appointment.id)}
                        />
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > 0 ? (
              <AppointmentsListPagination
                page={safePage}
                totalPages={totalPages}
                totalCount={totalCount}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        </div>
      </div>

      <AppointmentDetailDialog
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onReschedule={handleReschedule}
        onCancel={(id) => void handleCancel(id)}
      />

      <style dangerouslySetInnerHTML={{ __html: appointmentsScrollbarCss() }} />
    </div>
  )
}

function EmptyState({
  message,
  showBookLink = false,
}: {
  message: string
  showBookLink?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center opacity-50">
      <CalendarDaysIcon className="mb-4 size-12 stroke-[1.25]" aria-hidden />
      <p className="text-[16px] font-bold text-[#1A1F1E]">{message}</p>
      {showBookLink ? (
        <Button
          type="button"
          asChild
          className="mt-4 gap-2 rounded-xl bg-[#1A5345] text-[12px] font-bold hover:bg-[#133F34]"
        >
          <Link href="/doctor-directory">
            <CalendarIcon className="size-4" aria-hidden />
            Book appointment
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
