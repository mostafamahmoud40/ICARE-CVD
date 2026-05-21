"use client"

import Link from "next/link"
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIcon,
  CalendarPlus2Icon,
  BanIcon,
  Building2Icon,
  ClipboardListIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  MoreHorizontalIcon,
  SearchIcon,
  SquareArrowOutUpRightIcon,
  UserCircle2Icon,
  UserIcon,
  VideoIcon,
  XIcon,
  FilterIcon,
  HistoryIcon,
  PlusIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileTextIcon,
  MoreVerticalIcon,
  CalendarIcon,
  ClockIcon,
  PencilLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  ListIcon,
  Trash2Icon,
  User2Icon,
} from "lucide-react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday 
} from "date-fns"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PopoverClose } from "@radix-ui/react-popover"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { showIcareToast } from "@/components/shared/icare-toast"

import type {
  AssistantAppointment,
  AssistantAppointmentAdvancedFilters,
  AssistantAppointmentStatus,
  AssistantAppointmentVisitType,
  AppointmentStats,
  DoctorOption,
  PatientOption,
  PatchAssistantAppointmentPayload,
} from "./assistantAppointments.types"
import { AppointmentPersonPicker } from "./AppointmentPersonPicker"
import { useAssistantAppointmentAvailableSlots } from "./useAssistantAppointments"

const FILTER_SELECT_ALL = "__icare_filter_all__"

type AssistantAppointmentsProps = {
  appointments: AssistantAppointment[]
  totalAppointments: number
  counts: AppointmentStats
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: AssistantAppointmentStatus | "all"
  setStatusFilter: (value: AssistantAppointmentStatus | "all") => void
  advancedFilters: AssistantAppointmentAdvancedFilters
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AssistantAppointmentAdvancedFilters>>
  resetAdvancedFilters: () => void
  hasActiveAdvancedFilters: boolean
  doctorFilterOptions: string[]
  departmentOptions: string[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  updateStatus: (payload: { appointmentId: string; status: AssistantAppointmentStatus; cancellationReason?: string }) => Promise<void>
  isUpdatingStatus: boolean
  createAppointment: (payload: {
    patientId: string
    doctorId: string
    scheduledAt: string
    visitType: "clinic" | "virtual"
    reason: string
  }) => Promise<void>
  isCreating: boolean
  updateAppointment: (args: {
    appointmentId: string
    payload: PatchAssistantAppointmentPayload
  }) => Promise<unknown>
  isUpdatingAppointment: boolean
  doctors: DoctorOption[]
  patients: PatientOption[]
  defaultCreateDialogOpen?: boolean
}

const statusLabel: Record<AssistantAppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

const appointmentStatusBadgeClass: Record<AssistantAppointmentStatus, string> = {
  scheduled:
    "w-fit border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-amber-800 shadow-sm hover:bg-amber-50",
  confirmed:
    "w-fit border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-blue-700 shadow-sm hover:bg-blue-50",
  completed:
    "w-fit border border-[#1A5345]/20 bg-[#E8F0EE] px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#1A5345] shadow-sm hover:bg-[#E8F0EE]",
  cancelled:
    "w-fit border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-red-700 shadow-sm hover:bg-red-50",
}

const VISIT_REASON_OPTIONS: readonly string[] = [
  "Follow-up visit",
  "Routine cardiovascular check-up",
  "Medication review",
  "Post-procedure review",
  "Lab or imaging results review",
  "Blood pressure management",
  "Chest pain or palpitations",
  "Heart failure follow-up",
  "Anticoagulation clinic",
  "Risk assessment / prevention",
  "Pre-operative evaluation",
]

const BOOKING_TYPE_OPTIONS: readonly {
  value: AssistantAppointmentVisitType
  label: string
}[] = [
  { value: "clinic", label: "Clinic visit (in-person)" },
  { value: "virtual", label: "Virtual visit (telehealth)" },
]

function formatLocalDateInput(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatLocalTimeHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** e.g. "10:00 AM to 11:00 AM". Rows have no end time yet; duration defaults to 60 minutes. */
const DEFAULT_APPOINTMENT_DISPLAY_DURATION_MINUTES = 60

function formatLocalTimeRangeAmPm(
  iso: string,
  durationMinutes = DEFAULT_APPOINTMENT_DISPLAY_DURATION_MINUTES,
): string {
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return "—"
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${fmt.format(start)} to ${fmt.format(end)}`
}

function formatAppointmentDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function dicebearAvatarUrl(name: unknown, idFallback: unknown): string {
  const fromName =
    typeof name === "string" ? name.trim() : name != null ? String(name).trim() : ""
  const fromId = idFallback != null && idFallback !== "" ? String(idFallback) : ""
  const raw = (fromName || fromId || "x").replace(/\s+/g, "")
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(raw)}`
}

function pickerDisplayName(name: unknown, fallback: string): string {
  const s =
    typeof name === "string" ? name.trim() : name != null ? String(name).trim() : ""
  return s || fallback
}

export function AssistantAppointments({
  appointments,
  counts,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  advancedFilters,
  setAdvancedFilters,
  resetAdvancedFilters,
  hasActiveAdvancedFilters,
  doctorFilterOptions,
  departmentOptions,
  isLoading,
  isError,
  error,
  updateStatus,
  isUpdatingStatus,
  createAppointment,
  isCreating,
  updateAppointment,
  isUpdatingAppointment,
  doctors,
  patients,
  defaultCreateDialogOpen = false,
}: AssistantAppointmentsProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AssistantAppointment | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(defaultCreateDialogOpen)
  const [cancellingAppointment, setCancellingAppointment] = useState<AssistantAppointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  
  // View mode state
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [bookingDraft, setBookingDraft] = useState({
    patientId: "",
    doctorId: "",
    visitType: "clinic" as "clinic" | "virtual",
    date: "",
    timeSlot: "",
    reason: "",
  })

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editDraft, setEditDraft] = useState({
    patientId: "",
    doctorId: "",
    visitType: "clinic" as "clinic" | "virtual",
    date: "",
    timeSlot: "",
    reason: "",
  })

  const availableSlotsQuery = useAssistantAppointmentAvailableSlots(bookingDraft.doctorId, bookingDraft.date)
  const editAvailableSlotsQuery = useAssistantAppointmentAvailableSlots(editDraft.doctorId, editDraft.date)

  // Map doctors and patients to the format expected by AppointmentPersonPicker
  const patientPickerItems = useMemo(
    () =>
      patients.map((p) => ({
        id: String(p.id),
        name: pickerDisplayName(p.name, "Unnamed patient"),
        subtitle: p.phone != null ? String(p.phone) : null,
        avatarSrc: dicebearAvatarUrl(p.name, p.id),
      })),
    [patients],
  )

  const doctorPickerItems = useMemo(
    () =>
      doctors.map((d) => ({
        id: String(d.id),
        name: pickerDisplayName(d.name, "Unnamed doctor"),
        subtitle: d.specialty != null ? String(d.specialty) : null,
        avatarSrc: dicebearAvatarUrl(d.name, d.id),
      })),
    [doctors],
  )

  const handleCancelConfirm = async () => {
    if (!cancellingAppointment || !cancellationReason.trim()) return
    try {
      await updateStatus({
        appointmentId: cancellingAppointment.id,
        status: "cancelled",
        cancellationReason: cancellationReason.trim(),
      })
      showIcareToast({ title: "Success", description: "Appointment cancelled successfully.", variant: "success" })
      setCancellingAppointment(null)
      setCancellationReason("")
    } catch (err) {
      showIcareToast({ title: "Error", description: "Failed to cancel appointment.", variant: "destructive" })
    }
  }

  const handleCreate = async () => {
    if (!bookingDraft.patientId || !bookingDraft.doctorId || !bookingDraft.date || !bookingDraft.timeSlot || !bookingDraft.reason) return
    try {
      const [year, month, day] = bookingDraft.date.split("-").map(Number)
      const [hours, minutes] = bookingDraft.timeSlot.split(":").map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()

      await createAppointment({
        patientId: bookingDraft.patientId,
        doctorId: bookingDraft.doctorId,
        scheduledAt,
        visitType: bookingDraft.visitType,
        reason: bookingDraft.reason,
      })
      showIcareToast({ title: "Success", description: "New appointment created.", variant: "success" })
      setBookingDraft({ patientId: "", doctorId: "", visitType: "clinic", date: "", timeSlot: "", reason: "" })
      setIsCreateDialogOpen(false)
    } catch (err) {
      showIcareToast({ title: "Error", description: "Failed to create appointment.", variant: "destructive" })
    }
  }

  const openEditDialog = (app: AssistantAppointment) => {
    setSelectedAppointment(app)
    setEditDraft({
      patientId: app.patientId,
      doctorId: app.doctorId,
      visitType: app.visitType,
      date: formatLocalDateInput(app.scheduledAt),
      timeSlot: formatLocalTimeHHMM(app.scheduledAt),
      reason: app.reason || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedAppointment || !editDraft.patientId || !editDraft.doctorId || !editDraft.date || !editDraft.timeSlot) return
    try {
      const [year, month, day] = editDraft.date.split("-").map(Number)
      const [hours, minutes] = editDraft.timeSlot.split(":").map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()

      await updateAppointment({
        appointmentId: selectedAppointment.id,
        payload: {
          patientId: editDraft.patientId,
          doctorId: editDraft.doctorId,
          scheduledAt,
          visitType: editDraft.visitType,
          reason: editDraft.reason,
        }
      })
      showIcareToast({ title: "Success", description: "Appointment updated.", variant: "success" })
      setIsEditDialogOpen(false)
      setSelectedAppointment(null)
    } catch (err) {
      showIcareToast({ title: "Error", description: "Failed to update appointment.", variant: "destructive" })
    }
  }

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  return (
    <div className="flex h-full min-h-0 flex-col animate-in fade-in duration-700">
      {/* Premium Header — compact */}
      <div className="bg-transparent px-6 pb-3 pt-4 sm:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-0.5">
            <h1 className="font-serif text-[22px] font-bold tracking-tight text-[#102F27] sm:text-[26px]">
              Appointments management
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
              Monitor and manage all patient clinical bookings and schedules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
             {/* View Mode Toggle */}
             <div className="mr-1 flex items-center rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm sm:mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]",
                    viewMode === "table" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-[#F9F8F5]"
                  )}
                >
                   <ListIcon className="size-3.5 sm:size-4" />
                   List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]",
                    viewMode === "calendar" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-[#F9F8F5]"
                  )}
                >
                   <LayoutGridIcon className="size-3.5 sm:size-4" />
                   Calendar
                </Button>
             </div>

             <Button
                variant="outline"
                className="h-9 gap-2 rounded-xl border-[#E8E6E0] bg-white px-4 text-[13px] font-bold text-[#1A1F1E] shadow-sm transition-all hover:bg-[#F9F8F5] sm:h-10 sm:px-5 sm:text-[14px]"
             >
                <DownloadIcon className="size-4 text-muted-foreground" />
                Export data
             </Button>
             <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-9 gap-2 rounded-full border-0 bg-[#1A5345] px-4 text-[13px] font-bold text-white shadow-[0_4px_14px_rgba(26,83,69,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#133F34] hover:shadow-[0_6px_20px_rgba(26,83,69,0.25)] sm:h-10 sm:px-6 sm:text-[14px]"
             >
                <PlusIcon className="size-4 sm:size-[18px]" strokeWidth={2.5} />
                New appointment
             </Button>
          </div>
        </div>

        {/* Filters and Stats Summary */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-b border-[#E8E6E0]/60 pb-3 sm:flex-row">
           <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
              {[
                { id: "all", label: "All bookings" },
                { id: "scheduled", label: "Scheduled" },
                { id: "confirmed", label: "Confirmed" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all sm:rounded-xl sm:px-4 sm:py-2 sm:text-[13px]",
                    statusFilter === tab.id 
                      ? "bg-[#1A5345] text-white shadow-md shadow-[#1A5345]/10" 
                      : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E] hover:shadow-sm"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "ml-1.5 rounded-md bg-black/5 px-1 py-0.5 text-[10px] font-medium opacity-70 sm:ml-2 sm:text-[11px]",
                    statusFilter === tab.id ? "bg-white/10 text-white/80" : "text-muted-foreground"
                  )}>
                    {tab.id === 'all' ? counts.total : counts[tab.id as keyof AppointmentStats]}
                  </span>
                </button>
              ))}
           </div>
           
           <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              {viewMode === "calendar" ? (
                <div className="flex items-center gap-1 rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm sm:gap-2">
                   <Button variant="ghost" size="icon" className="size-8 rounded-lg sm:size-9" onClick={prevMonth}>
                      <ChevronLeftIcon className="size-4" />
                   </Button>
                   <span className="min-w-[108px] px-2 text-center text-[13px] font-bold sm:min-w-[120px] sm:px-3 sm:text-[14px]">
                      {format(currentMonth, "MMMM yyyy")}
                   </span>
                   <Button variant="ghost" size="icon" className="size-8 rounded-lg sm:size-9" onClick={nextMonth}>
                      <ChevronRightIcon className="size-4" />
                   </Button>
                </div>
              ) : (
                <div className="relative flex-1 sm:flex-none sm:w-[260px] lg:w-[280px]">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or id..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-full rounded-xl border-[#E8E6E0] bg-white pl-9 text-[13px] shadow-sm focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/20 sm:h-10 sm:rounded-2xl sm:pl-10 sm:text-[14px]"
                  />
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className={cn(
                    "size-9 shrink-0 rounded-xl border-[#E8E6E0] bg-white text-muted-foreground shadow-sm hover:text-[#1A1F1E] sm:size-10 sm:rounded-2xl",
                    hasActiveAdvancedFilters && "border-[#1A5345] bg-[#E8F0EE] text-[#1A5345]"
                  )}>
                    <FilterIcon className="size-4 sm:size-[18px]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden" align="end">
                   <div className="bg-[#1A5345] p-5 text-white">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[16px] font-bold font-serif">Advanced filters</h4>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-7 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/10 px-2"
                           onClick={resetAdvancedFilters}
                         >
                            Reset all
                         </Button>
                      </div>
                   </div>
                   <div className="p-6 space-y-6 bg-white">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-[#102F27]">Department</Label>
                        <Select 
                          value={advancedFilters.department || FILTER_SELECT_ALL} 
                          onValueChange={(v) => setAdvancedFilters(f => ({ ...f, department: v === FILTER_SELECT_ALL ? "" : v }))}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50">
                            <SelectValue placeholder="All departments" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                             <SelectItem value={FILTER_SELECT_ALL}>All departments</SelectItem>
                             {departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-[#102F27]">Doctor</Label>
                        <Select 
                          value={advancedFilters.doctorName || FILTER_SELECT_ALL} 
                          onValueChange={(v) => setAdvancedFilters(f => ({ ...f, doctorName: v === FILTER_SELECT_ALL ? "" : v }))}
                        >
                          <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50">
                            <SelectValue placeholder="All doctors" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                             <SelectItem value={FILTER_SELECT_ALL}>All doctors</SelectItem>
                             {doctorFilterOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="space-y-2">
                            <Label className="text-[12px] font-bold text-[#102F27]">From date</Label>
                            <Input 
                              type="date" 
                              value={advancedFilters.dateFrom} 
                              onChange={(e) => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                              className="h-10 rounded-xl" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[12px] font-bold text-[#102F27]">To date</Label>
                            <Input 
                              type="date" 
                              value={advancedFilters.dateTo} 
                              onChange={(e) => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                              className="h-10 rounded-xl" 
                            />
                         </div>
                      </div>
                   </div>
                </PopoverContent>
              </Popover>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 pb-10">
        {viewMode === "table" ? (
          <div className="overflow-hidden rounded-3xl border border-[#E8E6E0]/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse bg-white text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[#E8E6E0]/60 bg-white text-[15px] font-serif font-bold text-[#1A1F1E] transition-colors">
                    <th className="py-4 pr-4 pl-4">Patient Name</th>
                    <th className="py-4 px-4">Condition</th>
                    <th className="py-4 px-4">Doctor</th>
                    <th className="py-4 px-4">Age / Sex</th>
                    <th className="py-4 px-4">Last Visit</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Risk Level</th>
                    <th className="py-4 pl-4 pr-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E6E0]/40">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="py-4 px-4">
                            <Skeleton className="h-5 w-full rounded-md" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-20 text-center">
                         <div className="flex flex-col items-center justify-center opacity-40">
                            <CalendarClockIcon className="size-12 mb-4" strokeWidth={1.5} />
                            <p className="text-[16px] font-bold">No appointments found</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => (
                      <tr key={appointment.id} className="group hover:bg-[#F9F8F5]/30 transition-colors">
                        <td className="py-4 pr-4 pl-4">
                          <div className="flex items-center gap-3">
                             <div className="size-10 rounded-full bg-[#F3F4F6] border border-[#E8E6E0]/60 overflow-hidden shrink-0">
                                <img 
                                  src={dicebearAvatarUrl(appointment.patientName, appointment.id)} 
                                  alt="" 
                                  className="size-full object-cover"
                                />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[14px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors truncate">{appointment.patientName}</p>
                                <p className="text-[11px] font-bold text-muted-foreground mt-0.5 tracking-tight">#{appointment.id.slice(0, 8).toUpperCase()}</p>
                             </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                           <p className="text-[14px] font-medium text-[#1A1F1E]/80">{appointment.reason || "General checkup"}</p>
                        </td>
                        <td className="py-4 px-4">
                           <div className="flex items-center gap-2.5">
                              <div className="size-8 rounded-full bg-[#E5EEEA] border border-[#1A5345]/10 overflow-hidden shrink-0">
                                 <img 
                                   src={dicebearAvatarUrl(appointment.doctorName, appointment.doctorId ?? appointment.id)} 
                                   alt="" 
                                   className="size-full object-cover"
                                 />
                              </div>
                              <p className="text-[14px] font-bold text-[#1A1F1E] truncate">{appointment.doctorName}</p>
                           </div>
                        </td>
                        <td className="py-4 px-4 text-[14px] font-medium text-[#1A1F1E]/70">
                           37 / m
                        </td>
                        <td className="py-4 px-4 text-[14px] font-bold text-[#1A1F1E]">
                           {formatAppointmentDate(appointment.scheduledAt)}
                        </td>
                        <td className="py-4 px-4">
                           <Badge variant="outline" className={cn(
                             "rounded-full px-3 py-1 text-[11px] font-bold",
                             appointmentStatusBadgeClass[appointment.status]
                           )}>
                              {statusLabel[appointment.status]}
                           </Badge>
                        </td>
                        <td className="py-4 px-4">
                           <Badge variant="outline" className={cn(
                             "rounded-lg border-[#E8E6E0] bg-white px-2.5 py-1 text-[11px] font-bold",
                             appointment.visitType === "virtual" ? "text-amber-600" : "text-red-600"
                           )}>
                              {appointment.visitType === "virtual" ? "Moderate risk" : "High risk"}
                           </Badge>
                        </td>
                        <td className="py-4 pl-4 pr-4 text-right">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground hover:bg-[#F9F8F5] transition-all opacity-0 group-hover:opacity-100">
                                    <MoreVerticalIcon className="size-5" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#E8E6E0]/60 p-1.5 shadow-xl">
                                 <DropdownMenuItem onSelect={() => setSelectedAppointment(appointment)}>
                                    <UserCircle2Icon className="size-4 mr-2.5" />
                                    View details
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onSelect={() => openEditDialog(appointment)}>
                                    <PencilLineIcon className="size-4 mr-2.5" />
                                    Edit schedule
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                                 <DropdownMenuItem onSelect={() => updateStatus({ appointmentId: appointment.id, status: "confirmed" })} disabled={appointment.status === 'confirmed' || isUpdatingStatus}>
                                    <CheckCircle2Icon className="size-4 mr-2.5 text-blue-600" />
                                    Confirm booking
                                 </DropdownMenuItem>
                                 <DropdownMenuItem onSelect={() => updateStatus({ appointmentId: appointment.id, status: "completed" })} disabled={appointment.status === 'completed' || isUpdatingStatus}>
                                    <CalendarCheck2Icon className="size-4 mr-2.5 text-emerald-600" />
                                    Mark as completed
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="bg-[#E8E6E0]/60 my-1" />
                                 <DropdownMenuItem onSelect={() => setCancellingAppointment(appointment)} disabled={appointment.status === 'cancelled' || isUpdatingStatus} className="text-red-600">
                                    <XIcon className="size-4 mr-2.5" />
                                    Cancel appointment
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Calendar View */
          <div className="h-full flex flex-col rounded-3xl border border-[#E8E6E0]/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.02)] overflow-hidden animate-in zoom-in-95 duration-500">
             {/* Days of week header */}
             <div className="grid grid-cols-7 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                   <div key={day} className="px-4 py-3 text-center text-[12px] font-bold text-muted-foreground uppercase tracking-widest border-r last:border-0 border-[#E8E6E0]/40">
                      {day}
                   </div>
                ))}
             </div>
             
             {/* Calendar Grid */}
             <div className="flex-1 grid grid-cols-7 grid-rows-5">
                {calendarDays.map((day, idx) => {
                   const dayAppointments = appointments.filter(app => isSameDay(new Date(app.scheduledAt), day))
                   const isCurrentMonth = isSameMonth(day, currentMonth)
                   const isTodayDay = isToday(day)
                   
                   return (
                      <Popover key={day.toISOString()}>
                         <PopoverTrigger asChild>
                            <div 
                              className={cn(
                                "min-h-[120px] p-2 border-r border-b border-[#E8E6E0]/40 transition-colors flex flex-col group cursor-pointer",
                                !isCurrentMonth && "bg-[#F9F8F5]/30 opacity-40",
                                isCurrentMonth && "hover:bg-[#1A5345]/[0.02]",
                                idx % 7 === 6 && "border-r-0"
                              )}
                            >
                               <div className="flex items-center justify-between mb-2">
                                  <span className={cn(
                                    "size-7 flex items-center justify-center rounded-full text-[13px] font-bold",
                                    isTodayDay ? "bg-[#1A5345] text-white" : "text-[#102F27]"
                                  )}>
                                     {format(day, "d")}
                                  </span>
                                  {dayAppointments.length > 0 && (
                                     <span className="text-[10px] font-bold text-muted-foreground bg-[#F3F4F6] px-1.5 py-0.5 rounded-md">
                                        {dayAppointments.length}
                                     </span>
                                  )}
                               </div>
                               
                               <div className="flex-1 flex flex-wrap content-start gap-1">
                                  {dayAppointments.slice(0, 8).map(app => (
                                     <Popover key={app.id}>
                                        <PopoverTrigger asChild>
                                           <button 
                                             onClick={(e) => e.stopPropagation()} 
                                             className="relative transition-transform hover:scale-110 active:scale-95"
                                           >
                                              <div className={cn(
                                                "size-8 rounded-full border-2 border-white ring-1 ring-black/5 overflow-hidden shadow-sm",
                                                app.status === 'confirmed' ? "ring-[#1A5345]/30" : 
                                                app.status === 'cancelled' ? "ring-red-300" : "ring-amber-200"
                                              )}>
                                                <img
                                                  src={dicebearAvatarUrl(app.patientName, app.id)}
                                                  alt={app.patientName ?? ""}
                                                  className="size-full object-cover"
                                                />
                                              </div>
                                           </button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                          className="w-[240px] p-4 rounded-2xl border-0 shadow-2xl bg-white z-[60]"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                           <div className="flex items-start gap-3">
                                              <div className="size-10 rounded-full bg-[#F3F4F6] overflow-hidden shrink-0">
                                                 <img
                                                   src={dicebearAvatarUrl(app.patientName, app.id)}
                                                   alt=""
                                                   className="size-full"
                                                 />
                                              </div>
                                              <div className="min-w-0">
                                                 <p className="text-[14px] font-bold text-[#1A1F1E] truncate">{app.patientName}</p>
                                                 <p className="text-[11px] font-bold text-muted-foreground mt-0.5">{formatLocalTimeRangeAmPm(app.scheduledAt)} · {app.doctorName}</p>
                                                 <Badge variant="outline" className={cn("mt-2 rounded-lg text-[10px]", appointmentStatusBadgeClass[app.status])}>
                                                    {statusLabel[app.status]}
                                                 </Badge>
                                              </div>
                                           </div>
                                           <div className="mt-4 flex gap-2">
                                              <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] rounded-lg" onClick={() => setSelectedAppointment(app)}>
                                                 Details
                                              </Button>
                                              <div
                                                 className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground shadow-xs pointer-events-none select-none"
                                                 aria-hidden="true"
                                              >
                                                 <PencilLineIcon className="size-3.5" />
                                              </div>
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 size-8 p-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100" 
                                                onClick={(e) => { e.stopPropagation(); setCancellingAppointment(app); }}
                                              >
                                                 <Trash2Icon className="size-3.5" />
                                              </Button>
                                           </div>
                                        </PopoverContent>
                                     </Popover>
                                  ))}
                                  {dayAppointments.length > 8 && (
                                     <div className="size-8 rounded-full bg-[#F3F4F6] border-2 border-white ring-1 ring-black/5 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                        +{dayAppointments.length - 8}
                                     </div>
                                  )}
                               </div>
                               
                               {isCurrentMonth && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     setBookingDraft(prev => ({ ...prev, date: formatLocalDateInput(day.toISOString()) }))
                                     setIsCreateDialogOpen(true)
                                   }}
                                   className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto flex items-center gap-1.5 text-[11px] font-bold text-[#1A5345] hover:underline"
                                 >
                                    <PlusIcon className="size-3" />
                                    Book
                                 </button>
                               )}
                            </div>
                         </PopoverTrigger>
                         {dayAppointments.length > 0 && (
                            <PopoverContent
                              side={idx % 7 > 3 ? "left" : "right"}
                              align="start"
                              className="w-[300px] p-0 rounded-xl border border-[#E8E6E0] bg-white shadow-lg z-50"
                            >
                               <div className="flex items-center justify-between gap-2 border-b border-[#E8E6E0] px-3 py-2.5 sm:px-4 sm:py-3">
                                  <p className="text-[13px] font-semibold text-[#1A1F1E] sm:text-sm">
                                     {format(day, "d EEEE")}
                                  </p>
                                  <PopoverClose asChild>
                                     <button
                                       type="button"
                                       className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-[#F3F4F6] hover:text-[#1A1F1E]"
                                       aria-label="Close"
                                     >
                                        <XIcon className="size-4" />
                                     </button>
                                  </PopoverClose>
                               </div>
                               <div className="max-h-[320px] space-y-2 overflow-y-auto p-2 sm:max-h-[400px]">
                                  {dayAppointments.map((app) => (
                                     <button
                                        key={app.id}
                                        type="button"
                                        onClick={() => setSelectedAppointment(app)}
                                        className="flex w-full items-center gap-3 rounded-lg border border-[#E8E6E0] bg-white p-2.5 text-left transition-colors hover:bg-[#FAFAF9]"
                                     >
                                        <div className="relative shrink-0">
                                           <div className="size-10 overflow-hidden rounded-md border border-[#E8E6E0] bg-[#F9F8F5]">
                                              <img
                                                 src={dicebearAvatarUrl(app.patientName, app.id)}
                                                 alt=""
                                                 className="size-full object-cover"
                                              />
                                           </div>
                                           <span
                                              className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#1A1F1E] text-white ring-2 ring-white"
                                              title={
                                                 app.visitType === "virtual"
                                                    ? "Virtual visit"
                                                    : "Clinic visit"
                                              }
                                           >
                                              {app.visitType === "virtual" ? (
                                                 <VideoIcon className="size-2.5" aria-hidden />
                                              ) : (
                                                 <Building2Icon className="size-2.5" aria-hidden />
                                              )}
                                           </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <div className="flex items-start justify-between gap-2">
                                              <p className="min-w-0 truncate text-[12px] font-semibold text-[#1A1F1E] sm:text-[13px]">
                                                 {app.patientName?.trim() || "Patient"}
                                              </p>
                                              <p className="shrink-0 text-right text-xs font-medium text-[#1A1F1E] sm:text-[13px] leading-snug">
                                                 {formatLocalTimeRangeAmPm(app.scheduledAt)}
                                              </p>
                                           </div>
                                           <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">
                                              {app.doctorName}
                                           </p>
                                        </div>
                                     </button>
                                  ))}
                               </div>
                            </PopoverContent>
                         )}
                      </Popover>
                   )
                })}
             </div>
          </div>
        )}
      </div>

      {/* Appointment Details Dialog - Modern Clinical Dashboard Design */}
      <Dialog open={Boolean(selectedAppointment && !isEditDialogOpen)} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-0 bg-white p-0 shadow-2xl overflow-hidden">
           {selectedAppointment && (
             <div className="flex flex-col animate-in fade-in zoom-in-95 duration-400">
               {/* Elegant Soft Header — compact */}
               <div className="relative overflow-hidden bg-[#F0F5F3] px-5 py-4 sm:px-6 sm:py-5">
                  <div className="absolute -right-14 -top-14 size-28 rounded-full bg-[#1A5345]/5 blur-3xl" />
                  <div className="relative flex items-center justify-between gap-3 sm:gap-4">
                     <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <div className="size-12 shrink-0 overflow-hidden rounded-2xl border border-white bg-white p-0.5 shadow-md shadow-[#1A5345]/10 sm:size-14">
                           <img
                              src={dicebearAvatarUrl(selectedAppointment.patientName, selectedAppointment.id)}
                              alt=""
                              className="size-full object-cover"
                           />
                        </div>
                        <div className="min-w-0">
                           <DialogTitle className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[20px]">
                              {selectedAppointment.patientName}
                           </DialogTitle>
                           <p className="mt-0.5 text-[11px] font-bold tracking-tight text-[#1A5345]/60 sm:text-[12px]">
                              #{selectedAppointment.id.slice(0, 8)}
                           </p>
                        </div>
                     </div>
                     <Badge
                        variant="outline"
                        className={cn(
                           "shrink-0 rounded-full border-0 bg-white/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm sm:text-[11px]",
                           appointmentStatusBadgeClass[selectedAppointment.status],
                        )}
                     >
                        {statusLabel[selectedAppointment.status]}
                     </Badge>
                  </div>
               </div>

               {/* Content Sections — compact */}
               <div className="space-y-5 px-5 py-5 sm:space-y-6 sm:px-6 sm:py-6">
                  {/* Section 1: Timeline & Physician */}
                  <div className="grid grid-cols-2 gap-x-5 sm:gap-x-8">
                     <div className="relative space-y-0.5 border-l-2 border-[#1A5345]/10 pl-4">
                        <div className="absolute -left-[7px] top-0 size-3 rounded-full border-2 border-[#1A5345] bg-white shadow-sm" />
                        <p className="text-[10px] font-bold tracking-tight text-muted-foreground sm:text-[11px]">
                           Schedule
                        </p>
                        <p className="text-[14px] font-bold text-[#102F27] sm:text-[15px]">
                           {formatAppointmentDate(selectedAppointment.scheduledAt)}
                        </p>
                        <p className="text-[12px] font-bold text-[#1A5345] sm:text-[13px]">
                           {formatLocalTimeRangeAmPm(selectedAppointment.scheduledAt)}
                        </p>
                     </div>

                     <div className="space-y-0.5">
                        <p className="text-[10px] font-bold tracking-tight text-muted-foreground sm:text-[11px]">
                           Practitioner
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                           <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E8E6E0] bg-[#F9F8F5] sm:size-8">
                              <UserIcon className="size-3.5 text-[#1A5345]/40 sm:size-4" />
                           </div>
                           <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold leading-tight text-[#102F27] sm:text-[14px]">
                                 {selectedAppointment.doctorName}
                              </p>
                              <p className="mt-0.5 truncate text-[10px] font-bold text-muted-foreground sm:text-[11px]">
                                 {selectedAppointment.department}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Clinical Context */}
                  <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E8E6E0]/60" />
                        <span className="shrink-0 text-[10px] font-bold tracking-tight text-muted-foreground sm:text-[11px]">
                           Clinical context
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E8E6E0]/60" />
                     </div>
                     <div className="group relative rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/70 p-4 sm:rounded-2xl">
                        <ActivityIcon className="absolute right-3 top-3 size-4 text-[#1A5345]/5 transition-colors group-hover:text-[#1A5345]/10 sm:right-4 sm:top-4 sm:size-5" />
                        <p className="mb-1 text-[10px] font-bold text-[#1A5345]/50 sm:text-[11px]">Visit Reason</p>
                        <p className="text-[13px] font-medium leading-snug text-[#102F27] sm:text-[14px] sm:leading-relaxed">
                           {selectedAppointment.reason ||
                              "General cardiovascular health assessment and vital signs monitoring."}
                        </p>
                     </div>
                  </div>

                  {/* Section 3: Interaction */}
                  <div className="flex items-center gap-2 pt-1">
                     <Button
                        variant="ghost"
                        className="h-9 flex-1 rounded-xl font-bold text-muted-foreground transition-all hover:bg-[#F9F8F5] hover:text-[#1A1F1E] sm:h-10 sm:rounded-2xl"
                        onClick={() => setSelectedAppointment(null)}
                     >
                        Close
                     </Button>
                     <Button
                        asChild
                        className="flex-[2] h-9 rounded-xl bg-[#1A5345] text-[12px] font-bold text-white shadow-lg shadow-[#1A5345]/15 transition-all hover:bg-[#133F34] sm:h-10 sm:rounded-2xl sm:text-[13px]"
                     >
                        <Link href={`/assistant-patients/${selectedAppointment.patientId}`}>
                           Access Medical Chart
                        </Link>
                     </Button>
                  </div>
               </div>
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="space-y-5 bg-white p-5 sm:space-y-6 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="font-serif text-[20px] font-bold tracking-tight text-[#1A1F1E] sm:text-[22px]">
                  Edit schedule
                </DialogTitle>
                <DialogDescription className="text-[13px] font-medium text-muted-foreground">
                  Modify the details or timing for this clinical booking.
                </DialogDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 sm:size-11">
                <PencilLineIcon className="size-5 text-amber-600 sm:size-[22px]" />
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    Patient
                  </Label>
                  <AppointmentPersonPicker 
                    items={patientPickerItems}
                    value={editDraft.patientId}
                    onValueChange={(val) => setEditDraft(prev => ({ ...prev, patientId: val }))}
                    placeholder="Search patients..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <User2Icon className="size-3.5 text-muted-foreground" />
                    Doctor
                  </Label>
                  <AppointmentPersonPicker 
                    items={doctorPickerItems}
                    value={editDraft.doctorId}
                    onValueChange={(val) => setEditDraft(prev => ({ ...prev, doctorId: val, timeSlot: "" }))}
                    placeholder="Search doctors..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <Building2Icon className="size-3.5 text-muted-foreground" />
                    Booking type
                  </Label>
                  <Select
                    value={editDraft.visitType}
                    onValueChange={(val) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        visitType: val as AssistantAppointmentVisitType,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30">
                      <SelectValue placeholder="Select booking type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {BOOKING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <ActivityIcon className="size-3.5 text-muted-foreground" />
                    Visit reason
                  </Label>
                  <Select
                    value={editDraft.reason}
                    onValueChange={(val) => setEditDraft((prev) => ({ ...prev, reason: val }))}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {VISIT_REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    Date
                  </Label>
                  <Input 
                    type="date" 
                    value={editDraft.date} 
                    onChange={(e) => setEditDraft(prev => ({ ...prev, date: e.target.value, timeSlot: "" }))} 
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    Time
                  </Label>
                  <Select value={editDraft.timeSlot} onValueChange={(value) => setEditDraft(prev => ({ ...prev, timeSlot: value }))} disabled={!editDraft.date || !editDraft.doctorId}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Choose slot" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {editAvailableSlotsQuery.data?.map(slot => <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-10 flex-1 rounded-xl font-bold sm:rounded-2xl">Cancel</Button>
                 <Button type="submit" className="h-10 flex-1 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 sm:rounded-2xl" disabled={isUpdatingAppointment}>
                   {isUpdatingAppointment ? "Updating..." : "Save changes"}
                 </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="space-y-5 bg-white p-5 sm:space-y-6 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="font-serif text-[20px] font-bold tracking-tight text-[#1A1F1E] sm:text-[22px]">
                  New appointment
                </DialogTitle>
                <DialogDescription className="text-[13px] font-medium text-muted-foreground">
                  Create a clinical booking for an existing patient.
                </DialogDescription>
              </div>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5] sm:size-11">
                <CalendarPlus2Icon className="size-5 text-[#1A5345] sm:size-[22px]" />
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    Patient
                  </Label>
                  <AppointmentPersonPicker 
                    items={patientPickerItems}
                    value={bookingDraft.patientId}
                    onValueChange={(val) => setBookingDraft(prev => ({ ...prev, patientId: val }))}
                    placeholder="Search patients..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <User2Icon className="size-3.5 text-muted-foreground" />
                    Doctor
                  </Label>
                  <AppointmentPersonPicker 
                    items={doctorPickerItems}
                    value={bookingDraft.doctorId}
                    onValueChange={(val) => setBookingDraft(prev => ({ ...prev, doctorId: val, timeSlot: "" }))}
                    placeholder="Search doctors..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <Building2Icon className="size-3.5 text-muted-foreground" />
                    Booking type
                  </Label>
                  <Select
                    value={bookingDraft.visitType}
                    onValueChange={(val) =>
                      setBookingDraft((prev) => ({
                        ...prev,
                        visitType: val as AssistantAppointmentVisitType,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30">
                      <SelectValue placeholder="Select booking type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {BOOKING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <ActivityIcon className="size-3.5 text-muted-foreground" />
                    Visit reason
                  </Label>
                  <Select
                    value={bookingDraft.reason}
                    onValueChange={(val) => setBookingDraft((prev) => ({ ...prev, reason: val }))}
                  >
                    <SelectTrigger className="h-10 w-full min-w-0 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30">
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {VISIT_REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <CalendarIcon className="size-3.5 text-muted-foreground" />
                    Date
                  </Label>
                  <Input 
                    type="date" 
                    value={bookingDraft.date} 
                    onChange={(e) => setBookingDraft(prev => ({ ...prev, date: e.target.value, timeSlot: "" }))} 
                    className="h-10 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30 transition-all focus:bg-white focus:ring-[#1A5345]/20" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    Time
                  </Label>
                  <Select value={bookingDraft.timeSlot} onValueChange={(value) => setBookingDraft(prev => ({ ...prev, timeSlot: value }))} disabled={!bookingDraft.date || !bookingDraft.doctorId}>
                    <SelectTrigger className="h-10 rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/30 transition-all focus:bg-white focus:ring-[#1A5345]/20">
                      <SelectValue placeholder="Choose slot" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]/60 shadow-xl">
                      {availableSlotsQuery.data?.map(slot => <SelectItem key={slot.value} value={slot.value} className="rounded-lg">{slot.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <Button 
                   type="button" 
                   variant="ghost" 
                   onClick={() => setIsCreateDialogOpen(false)} 
                   className="h-10 flex-1 rounded-xl font-bold text-muted-foreground transition-all hover:bg-[#F9F8F5] sm:rounded-2xl"
                 >
                   Cancel
                 </Button>
                 <Button 
                   type="submit" 
                   className="h-10 flex-1 rounded-xl bg-[#1A5345] font-bold text-white shadow-lg shadow-[#1A5345]/10 transition-all hover:-translate-y-0.5 hover:bg-[#133F34] active:translate-y-0 sm:rounded-2xl" 
                   disabled={isCreating || !bookingDraft.patientId || !bookingDraft.doctorId || !bookingDraft.date || !bookingDraft.timeSlot || !bookingDraft.reason}
                 >
                   {isCreating ? "Processing..." : "Confirm booking"}
                 </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog — compact */}
      <Dialog open={Boolean(cancellingAppointment)} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <DialogContent className="max-w-[min(100vw-2rem,22rem)] gap-0 rounded-2xl border-0 bg-white p-5 shadow-2xl sm:max-w-sm sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-red-50 sm:size-12">
              <BanIcon className="size-5 text-red-500 sm:size-6" />
            </div>
            <div className="mt-3 space-y-1 sm:mt-3.5">
              <DialogTitle className="text-[17px] font-bold leading-snug text-[#1A1F1E] sm:text-lg">
                Cancel appointment?
              </DialogTitle>
              <DialogDescription className="text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                Cancel for{" "}
                <span className="font-bold text-[#1A1F1E]">{cancellingAppointment?.patientName}</span>? This cannot be
                undone.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 sm:mt-5">
            <Label className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">Reason for cancellation</Label>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Clinical or administrative reason…"
              className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] transition-all focus:bg-white sm:min-h-[80px]"
            />
          </div>
          <div className="mt-4 flex gap-2 sm:mt-5 sm:gap-2.5">
            <Button
              variant="ghost"
              onClick={() => setCancellingAppointment(null)}
              className="h-9 flex-1 rounded-xl text-[12px] font-bold text-muted-foreground sm:h-10 sm:text-[13px]"
            >
              Go back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isUpdatingStatus || !cancellationReason.trim()}
              className="h-9 flex-1 rounded-xl text-[12px] font-bold shadow-md shadow-red-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 sm:h-10 sm:text-[13px]"
            >
              Yes, cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
