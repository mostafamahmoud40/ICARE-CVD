"use client"

import { useState, useMemo } from "react"
import type { Appointment, FilterTab } from "./appointments.types"
import { cn } from "@/lib/utils"
import { StatusBadge, LucideIcon } from "./shared"
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  StethoscopeIcon,
  SearchIcon,
  XIcon,
  BellIcon,
  FileTextIcon,
  PaperclipIcon,
  RefreshCwIcon,
  MoreVerticalIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { formatTimeOnly, formatDateTime } from "./appointments.utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getVisitTypeIcon(location: string, visitType?: string): string {
  if (visitType === "virtual" || location.toLowerCase().includes("virtual") || location.toLowerCase().includes("video")) {
    return "video"
  }
  return "building"
}

type CompactRowProps = {
  appointment: Appointment
  isPast?: boolean
  isCancelled?: boolean
  onClick?: () => void
}

function getVisitTypeLabel(location: string, visitType?: string): string {
  if (visitType === "virtual" || location.toLowerCase().includes("virtual") || location.toLowerCase().includes("video")) {
    return "Virtual"
  }
  return "In-Clinic"
}

function CompactRow({ appointment, isPast, isCancelled, onClick }: CompactRowProps) {
  const visitTypeIcon = getVisitTypeIcon(appointment.location, appointment.visitType)
  const visitTypeLabel = getVisitTypeLabel(appointment.location, appointment.visitType)
  const date = new Date(appointment.scheduledAt)
  const isToday = new Date().toDateString() === date.toDateString()

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex cursor-pointer items-center gap-2 border-b border-[#E8E6E0] px-3 py-3 transition-colors hover:bg-[#F9F8F5] lg:gap-3 lg:px-4",
        isPast && "opacity-70",
        isCancelled && "opacity-50"
      )}
    >
      {/* Code Column */}
      <div className="w-[92px] shrink-0 text-center lg:w-[110px]">
        <p className="font-mono text-[12px] font-medium text-[#00392D]">
          {appointment.confirmationCode}
        </p>
      </div>

      {/* Icon (Type) */}
      <div className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        visitTypeIcon === "video" ? "bg-violet-50" : "bg-[#E8F0EE]"
      )}>
        <LucideIcon
          name={visitTypeIcon}
          className={cn(
            "size-5",
            visitTypeIcon === "video" ? "text-violet-500" : "text-[#00392D]"
          )}
        />
      </div>

      {/* Date Column */}
      <div className="w-[56px] shrink-0 text-center lg:w-[64px]">
        <p className={cn(
          "text-[11px] font-medium uppercase",
          isToday ? "text-emerald-600" : "text-[#6B7870]"
        )}>
          {isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short" })}
        </p>
        <p className="text-lg font-bold text-[#1A1F1E]">{date.getDate()}</p>
      </div>

      {/* Content - Table Columns */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Doctor Column */}
          <div className="w-[120px] shrink-0 lg:w-[140px]">
            <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
              {appointment.clinician}
            </p>
            <p className="truncate text-[11px] text-[#6B7870]">{appointment.location}</p>
          </div>

          {/* Type Column */}
          <div className="w-[72px] shrink-0 lg:w-[80px]">
            <span className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
              visitTypeIcon === "video"
                ? "bg-violet-50 text-violet-600 border border-violet-200"
                : "bg-[#E8F0EE] text-[#00392D] border border-[#A8C4BC]"
            )}>
              <LucideIcon name={visitTypeIcon} className="size-3" />
              {visitTypeLabel}
            </span>
          </div>

          {/* Time Column */}
          <div className="w-[84px] shrink-0 lg:w-[96px]">
            <span className="flex items-center gap-1 text-[13px] text-[#1A1F1E]">
              <ClockIcon className="size-3.5 text-[#6B7870]" />
              {formatTimeOnly(appointment.scheduledAt)}
            </span>
          </div>

          {/* Reason Column */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-[#1A1F1E]">
              {appointment.reason?.trim() || appointment.department}
            </p>
          </div>
        </div>
      </div>

      {/* Status Column */}
      <div className="w-[64px] shrink-0 text-center lg:w-[76px]">
        <StatusBadge status={appointment.status} />
      </div>

      {/* Action Column (Arrow) */}
      <div className="w-3 shrink-0">
        <ChevronRightIcon className="size-4 text-[#9CA3AF] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

type MyAppointmentsProps = {
  appointments: Appointment[]
  upcoming: Appointment[]
  past: Appointment[]
  onBookNew: () => void
  onCancelAppointment: (appointmentId: string) => Promise<unknown>
  className?: string
}

export function MyAppointments({
  appointments,
  upcoming,
  past,
  onBookNew,
  onCancelAppointment,
  className,
}: MyAppointmentsProps) {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cancelledAppointments, setCancelledAppointments] = useState<string[]>([])

  // Get urgent appointments (within 24 hours)
  const urgentCount = useMemo(() => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    return upcoming.filter(a => {
      const apptDate = new Date(a.scheduledAt)
      return apptDate > now && apptDate <= tomorrow && a.status !== "cancelled"
    }).length
  }, [upcoming])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    if (filter === "upcoming") {
      filtered = upcoming.filter(a => !cancelledAppointments.includes(a.id))
    } else if (filter === "past") {
      filtered = past
    } else if (filter === "cancelled") {
      filtered = appointments.filter(a =>
        cancelledAppointments.includes(a.id) || a.status === "cancelled"
      )
    } else {
      // All - exclude cancelled from main list
      filtered = appointments.filter(a =>
        !cancelledAppointments.includes(a.id) && a.status !== "cancelled"
      )
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.department.toLowerCase().includes(query) ||
        a.clinician.toLowerCase().includes(query) ||
        a.location.toLowerCase().includes(query) ||
        a.confirmationCode.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [appointments, upcoming, past, filter, searchQuery, cancelledAppointments])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleCancel = async (id: string) => {
    try {
      await onCancelAppointment(id)
      setCancelledAppointments(prev => [...prev, id])
      setSelectedAppointment(null)
    } catch {
      alert("Could not cancel appointment. Please try again.")
    }
  }

  const handleReschedule = (appointment: Appointment) => {
    // Open booking with pre-filled data
    setSelectedAppointment(null)
    onBookNew()
  }

  return (
    <>
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
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#00392D]">
              <StethoscopeIcon className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1A1F1E]">Appointments</h2>
              <p className="text-[11px] text-[#6B7870]">
                {upcoming.length} upcoming · {past.length} past
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <button className="relative rounded-lg p-2 text-[#6B7870] hover:bg-[#E8E6E0]/50">
              <BellIcon className="size-5" />
              {urgentCount > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {urgentCount}
                </span>
              )}
            </button>
            {/* Refresh */}
            <button 
              onClick={handleRefresh}
              className={cn(
                "rounded-lg p-2 text-[#6B7870] hover:bg-[#E8E6E0]/50",
                isRefreshing && "animate-spin"
              )}
            >
              <RefreshCwIcon className="size-5" />
            </button>
            <Button
              onClick={onBookNew}
              className="h-8 gap-1.5 rounded-lg bg-[#00392D] px-3 text-[13px] font-semibold"
            >
              <CalendarIcon className="size-4" />
              Book
            </Button>
          </div>
        </div>

        {/* Filter Tabs with Search */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-80 lg:w-96">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
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
              {(["all", "upcoming", "past", "cancelled"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                    filter === tab
                      ? "bg-[#00392D] text-white"
                      : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="w-full overflow-hidden">
        <div className="w-full">
        {/* Table Header */}
        <div className="flex items-center gap-2 border-b border-[#E8E6E0] bg-[#F9F8F5] px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7870] lg:gap-3 lg:px-4">
          <div className="w-[92px] shrink-0 text-center lg:w-[110px]">Code</div>
          <div className="flex size-10 shrink-0 items-center justify-center">Type</div>
          <div className="w-[56px] shrink-0 text-center lg:w-[64px]">Date</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="w-[120px] lg:w-[140px]">Doctor</span>
              <span className="w-[72px] lg:w-[80px]">Type</span>
              <span className="w-[84px] lg:w-[96px]">Time</span>
              <span className="flex-1">Reason</span>
            </div>
          </div>
          <div className="w-[64px] text-center lg:w-[76px]">Status</div>
          <div className="w-3 shrink-0"></div>
        </div>

        {filteredAppointments.length === 0 ? (
          <EmptyState
            message={searchQuery
              ? "No appointments match your search."
              : "No appointments found. Book your first visit!"
            }
            onBookNew={onBookNew}
          />
        ) : (
          <div>
            {filteredAppointments.map((appointment) => (
              <CompactRow
                key={appointment.id}
                appointment={appointment}
                isCancelled={cancelledAppointments.includes(appointment.id) || appointment.status === "cancelled"}
                onClick={() => setSelectedAppointment(appointment)}
              />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>Appointment Details</span>
                  <StatusBadge status={selectedAppointment.status} />
                </DialogTitle>
                <DialogDescription>
                  Confirmation Code: <span className="font-mono font-bold text-[#00392D]">{selectedAppointment.confirmationCode}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Doctor Info */}
                <div className="flex items-start gap-3 rounded-lg bg-[#F9F8F5] p-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#E8F0EE]">
                    <StethoscopeIcon className="size-5 text-[#00392D]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1F1E]">{selectedAppointment.clinician}</p>
                    <p className="text-[13px] text-[#6B7870]">{selectedAppointment.department}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#E8E6E0] p-3">
                    <p className="text-[11px] uppercase text-[#6B7870]">Date</p>
                    <p className="font-semibold text-[#1A1F1E]">
                      {formatDateTime(selectedAppointment.scheduledAt).split(" at ")[0]}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E8E6E0] p-3">
                    <p className="text-[11px] uppercase text-[#6B7870]">Time</p>
                    <p className="font-semibold text-[#1A1F1E]">
                      {formatTimeOnly(selectedAppointment.scheduledAt)}
                    </p>
                  </div>
                </div>

                {/* Visit Type */}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#6B7870]">Visit Type:</span>
                  <span className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium",
                    selectedAppointment.visitType === "virtual"
                      ? "bg-violet-50 text-violet-600 border border-violet-200"
                      : "bg-[#E8F0EE] text-[#00392D] border border-[#A8C4BC]"
                  )}>
                    {selectedAppointment.visitType === "virtual" ? "Virtual Consultation" : "In-Clinic Visit"}
                  </span>
                </div>

                {/* Symptoms */}
                {selectedAppointment.symptoms && (
                  <div className="rounded-lg border border-[#E8E6E0] p-3">
                    <div className="flex items-center gap-2 text-[#6B7870]">
                      <FileTextIcon className="size-4" />
                      <span className="text-[11px] uppercase">Symptoms</span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#1A1F1E]">{selectedAppointment.symptoms}</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] uppercase text-[#6B7870]">Attachments</p>
                    <div className="space-y-2">
                      {selectedAppointment.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-[#E8E6E0] p-2 text-[13px] text-[#00392D] hover:bg-[#F9F8F5]"
                        >
                          <PaperclipIcon className="size-4" />
                          <span className="truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="rounded-lg bg-[#F9F8F5] p-3">
                    <p className="text-[11px] uppercase text-[#6B7870]">Notes</p>
                    <p className="mt-1 text-[13px] italic text-[#6B7870]">
                      &ldquo;{selectedAppointment.notes}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleReschedule(selectedAppointment)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        void handleCancel(selectedAppointment.id)
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  )
}

function EmptyState({ message, onBookNew }: { message: string; onBookNew?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
        <CalendarDaysIcon className="size-7 text-[#9CA3AF]" />
      </div>
      <p className="text-[14px] text-[#6B7870]">{message}</p>
      {onBookNew && (
        <Button
          onClick={onBookNew}
          className="mt-4 gap-2"
        >
          <CalendarIcon className="size-4" />
          Book Appointment
        </Button>
      )}
    </div>
  )
}
