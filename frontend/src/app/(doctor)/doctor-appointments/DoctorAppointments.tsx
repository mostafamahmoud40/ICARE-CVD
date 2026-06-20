"use client"

import Link from "next/link"
import { useState, useMemo } from "react"
import type { DoctorAppointment, FilterTab, VisitType } from "./doctorAppointments.types"
import { resolveAppointmentDisplayStatus } from "./appointmentDisplayStatus"
import { AppointmentList } from "./AppointmentList"
import { AppointmentDetail } from "./AppointmentDetail"
import { AppointmentCalendar } from "./AppointmentCalendar"
import { useDoctorAppointments } from "./useDoctorAppointments"
import {
  CalendarIcon,
  LayoutListIcon,
  SearchIcon,
  XIcon,
  DownloadIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ViewMode = "list" | "calendar"
type VisitTypeFilter = "all" | VisitType

const FILTER_SELECT_CLASS =
  "h-8 w-[168px] shrink-0 rounded-lg border border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A1F1E] shadow-sm focus-visible:border-[#1A5345]/30 focus-visible:ring-0 sm:w-[190px]"

const FILTER_OPTIONS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All appointments" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
]

const VISIT_TYPE_OPTIONS: { id: VisitTypeFilter; label: string }[] = [
  { id: "all", label: "All visit types" },
  { id: "clinic", label: "In-clinic" },
  { id: "virtual", label: "Virtual" },
]

function getFilterCount(
  id: FilterTab,
  stats: { today: number; upcoming: number; completed: number; cancelled: number },
  total: number,
) {
  switch (id) {
    case "today":
      return stats.today
    case "upcoming":
      return stats.upcoming
    case "completed":
      return stats.completed
    case "cancelled":
      return stats.cancelled
    default:
      return total
  }
}

export function DoctorAppointments() {
  const { appointments, stats, isLoading, updateStatus, updateNotes, reschedule, markNoShow, fetchAvailableSlots, isUpdating, isMarkingNoShow } = useDoctorAppointments()
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitTypeFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Find the latest version of the selected appointment (status may have changed)
  const currentSelected = selectedAppointment
    ? appointments.find((a) => a.id === selectedAppointment.id) ?? null
    : null

  const filteredAppointments = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    let filtered = appointments

    switch (filter) {
      case "today":
        filtered = appointments.filter((a) => {
          const date = new Date(a.scheduledAt)
          return (
            date >= todayStart &&
            date < todayEnd &&
            resolveAppointmentDisplayStatus(a) !== "cancelled"
          )
        })
        break
      case "upcoming":
        filtered = appointments.filter((a) => {
          const display = resolveAppointmentDisplayStatus(a)
          return (
            new Date(a.scheduledAt) > now &&
            (display === "scheduled")
          )
        })
        break
      case "completed":
        filtered = appointments.filter((a) => {
          const display = resolveAppointmentDisplayStatus(a)
          return display === "completed"
        })
        break
      case "cancelled":
        filtered = appointments.filter((a) => {
          const display = resolveAppointmentDisplayStatus(a)
          return display === "cancelled" || display === "no-show"
        })
        break
      default:
        filtered = appointments
    }

    if (visitTypeFilter !== "all") {
      filtered = filtered.filter((a) => a.visitType === visitTypeFilter)
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
  }, [appointments, filter, visitTypeFilter, searchQuery])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      {/* Premium Header — compact */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/doctor-patients" className="text-[10px] font-medium sm:text-[11px]">
                      Patients
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">Appointments</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Appointments management
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Monitor and manage your daily appointments and patient schedule.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="mr-1 flex items-center rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm sm:mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all",
                    viewMode === "list" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <LayoutListIcon className="size-3.5" />
                  List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all",
                    viewMode === "calendar" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50"
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  Calendar
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
              >
                <DownloadIcon className="size-3.5 text-muted-foreground" />
                Export
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          {viewMode === "list" && (
            <div className="mt-3 flex flex-row items-center justify-between gap-2 pt-1 sm:mt-4 sm:gap-3">
              <div className="group relative w-[168px] shrink-0 sm:w-[190px]">
                <SearchIcon
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]"
                  strokeWidth={2}
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-8 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7870]"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={visitTypeFilter}
                  onValueChange={(value) => setVisitTypeFilter(value as VisitTypeFilter)}
                >
                  <SelectTrigger className={FILTER_SELECT_CLASS}>
                    <SelectValue placeholder="Visit type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-[#E8E6E0] bg-white shadow-lg">
                    {VISIT_TYPE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className="cursor-pointer text-[12px] font-medium text-[#1A1F1E]"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filter} onValueChange={(value) => setFilter(value as FilterTab)}>
                  <SelectTrigger className={FILTER_SELECT_CLASS}>
                    <SelectValue placeholder="Filter appointments" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-[#E8E6E0] bg-white shadow-lg">
                    {FILTER_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className="cursor-pointer text-[12px] font-medium text-[#1A1F1E]"
                      >
                        {option.label} ({getFilterCount(option.id, stats, appointments.length)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="w-full pb-6 pt-4">
          {viewMode === "list" ? (
            <AppointmentList
              appointments={filteredAppointments}
              isLoading={isLoading}
              onSelectAppointment={setSelectedAppointment}
            />
          ) : (
            <AppointmentCalendar
              appointments={appointments}
              onSelectAppointment={setSelectedAppointment}
            />
          )}
        </div>
      </div>

      <AppointmentDetail
        appointment={currentSelected}
        onClose={() => setSelectedAppointment(null)}
        onUpdateStatus={(params) => updateStatus(params)}
        onUpdateNotes={(params) => updateNotes(params)}
        onReschedule={(params) => reschedule(params)}
        onMarkNoShow={(appointmentId) => markNoShow(appointmentId)}
        fetchAvailableSlots={fetchAvailableSlots}
        isUpdating={isUpdating || isMarkingNoShow}
      />
    </div>
  )
}
