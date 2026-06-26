"use client"

import Link from "next/link"
import * as React from "react"
import { useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { useAssistantPageTranslations } from "../use-assistant-i18n"
import {
  ActivityIcon,
  CalendarPlus2Icon,
  BanIcon,
  Building2Icon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  SearchIcon,
  UserCircle2Icon,
  UserIcon,
  VideoIcon,
  XIcon,
  FilterIcon,
  PlusIcon,
  DownloadIcon,
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { showIcareToast } from "@/components/shared/icare-toast"
import { AssistantProfileAvatar } from "@/app/(assistant)/AssistantProfileAvatar"
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_STYLES,
  resolveAppointmentDisplayStatus,
} from "@/app/(doctor)/doctor-appointments/appointmentDisplayStatus"

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

function formatAppointmentDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
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
  const { t, ts } = useAssistantPageTranslations("appointments")
  const locale = useLocale()



  const BOOKING_TYPE_OPTIONS = useMemo(
    (): readonly { value: AssistantAppointmentVisitType; label: string }[] => [
      { value: "clinic", label: t("bookingTypeClinic") },
      { value: "virtual", label: t("bookingTypeVirtual") },
    ],
    [t],
  )

  const filterTabs = useMemo(
    () => [
      { id: "all" as const, label: t("allBookings") },
      { id: "scheduled" as const, label: ts("statusScheduled") },
      { id: "completed" as const, label: ts("statusCompleted") },
      { id: "cancelled" as const, label: ts("statusCancelled") },
    ],
    [t, ts],
  )

  const weekdayLabels = useMemo(
    () => [
      ts("weekdaySun"),
      ts("weekdayMon"),
      ts("weekdayTue"),
      ts("weekdayWed"),
      ts("weekdayThu"),
      ts("weekdayFri"),
      ts("weekdaySat"),
    ],
    [ts],
  )

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
        name: pickerDisplayName(p.name, t("unnamedPatient")),
        subtitle: p.phone != null ? String(p.phone) : null,
        avatarUrl: p.avatarUrl,
      })),
    [patients, t],
  )

  const doctorPickerItems = useMemo(
    () =>
      doctors.map((d) => ({
        id: String(d.id),
        name: pickerDisplayName(d.name, t("unnamedDoctor")),
        subtitle: d.specialty != null ? String(d.specialty) : null,
        avatarUrl: d.avatarUrl,
      })),
    [doctors, t],
  )

  const handleCancelConfirm = async () => {
    if (!cancellingAppointment || !cancellationReason.trim()) return
    try {
      await updateStatus({
        appointmentId: cancellingAppointment.id,
        status: "cancelled",
        cancellationReason: cancellationReason.trim(),
      })
      showIcareToast({ title: ts("success"), description: t("toastCancelled"), variant: "success" })
      setCancellingAppointment(null)
      setCancellationReason("")
    } catch {
      showIcareToast({ title: ts("error"), description: t("toastCancelFailed"), variant: "destructive" })
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
      showIcareToast({ title: ts("success"), description: t("toastCreated"), variant: "success" })
      setBookingDraft({ patientId: "", doctorId: "", visitType: "clinic", date: "", timeSlot: "", reason: "" })
      setIsCreateDialogOpen(false)
    } catch {
      showIcareToast({ title: ts("error"), description: t("toastCreateFailed"), variant: "destructive" })
    }
  }

  const openEditDialog = (app: AssistantAppointment) => {
    setSelectedAppointment(app)
    setEditDraft({
      patientId: app.patientId || "",
      doctorId: app.doctorId || "",
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
          doctorId: editDraft.doctorId,
          scheduledAt,
          visitType: editDraft.visitType,
          reason: editDraft.reason,
        }
      })
      showIcareToast({ title: ts("success"), description: t("toastUpdated"), variant: "success" })
      setIsEditDialogOpen(false)
      setSelectedAppointment(null)
    } catch {
      showIcareToast({ title: ts("error"), description: t("toastUpdateFailed"), variant: "destructive" })
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      {/* Premium Header — compact */}
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/assistant-dashboard" className="text-[10px] font-medium sm:text-[11px]">
                      {ts("breadcrumbDashboard")}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">{t("breadcrumb")}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                {t("title")}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {t("subtitle")}
              </p>
            </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
             {/* View Mode Toggle */}
             <div className="me-1 flex shrink-0 items-center rounded-xl border border-[#E8E6E0] bg-white p-0.5 shadow-sm sm:me-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "h-8 gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-all",
                    viewMode === "table" ? "bg-[#1A5345] text-white shadow-sm" : "text-muted-foreground hover:bg-slate-50"
                  )}
                >
                   <ListIcon className="size-3.5" />
                   {ts("list")}
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
                   <LayoutGridIcon className="size-3.5" />
                   {ts("calendar")}
                </Button>
             </div>

             <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-lg border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm transition-colors hover:bg-slate-50 hover:text-[#1A5345]"
             >
                <DownloadIcon className="size-3.5 text-muted-foreground" />
                {ts("export")}
             </Button>
             <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-8 gap-2 rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
             >
                <PlusIcon className="size-3.5" strokeWidth={2.5} />
                {t("newAppointment")}
             </Button>
          </div>
        </div>

        {/* Filters and Stats Summary */}
        <div className="mt-3 flex flex-col gap-2 pt-1 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
           <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12px] font-bold transition-all",
                    statusFilter === tab.id 
                      ? "bg-[#1A5345] text-white shadow-sm" 
                      : "text-muted-foreground hover:bg-white hover:text-[#1A1F1E] hover:shadow-sm"
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "rounded-lg px-1.5 py-0.5 text-[10px] font-bold shadow-sm transition-colors",
                    statusFilter === tab.id ? "bg-white/10 text-white" : "bg-black/5 text-[#1A5345]"
                  )}>
                    {tab.id === 'all' ? counts.total : counts[tab.id as keyof AppointmentStats]}
                  </span>
                </button>
              ))}
           </div>
           
            <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
               {viewMode === "calendar" ? (
                 <div className="flex h-8 items-center gap-1 rounded-lg border border-[#E8E6E0] bg-white p-0.5 shadow-sm">
                    <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]" onClick={prevMonth}>
                       <ChevronLeftIcon className="size-3.5" />
                    </Button>
                    <span className="min-w-[100px] px-1 text-center text-[12px] font-bold text-[#1A1F1E]">
                       {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <Button variant="ghost" size="icon" className="size-7 rounded-md text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]" onClick={nextMonth}>
                       <ChevronRightIcon className="size-3.5" />
                    </Button>
                 </div>
               ) : (
                 <div className="group relative flex-1 sm:flex-none sm:w-[240px]">
                   <SearchIcon 
                     className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9CA3AF] transition-colors group-focus-within:text-[#1A5345]" 
                     strokeWidth={2}
                     aria-hidden
                   />
                   <Input
                     type="search"
                     placeholder={ts("searchByNameOrId")}
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="h-8 w-full rounded-lg border border-[#E8E6E0] bg-white pl-9 pr-3 text-[12px] font-medium text-[#1A1F1E] shadow-sm transition-all placeholder:text-muted-foreground/50 focus-visible:border-[#1A5345]/30 focus-visible:ring-0"
                   />
                 </div>
               )}
               <Popover>
                 <PopoverTrigger asChild>
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     title={ts("filterView")}
                     className={cn(
                       "size-8 shrink-0 border-0 bg-transparent text-[#6B7870] hover:bg-transparent hover:text-[#1A5345] shadow-none transition-colors",
                       hasActiveAdvancedFilters && "text-[#1A5345]"
                     )}
                   >
                     <FilterIcon className="size-4" strokeWidth={hasActiveAdvancedFilters ? 2.5 : 2} />
                   </Button>
                 </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0 rounded-2xl border border-[#E8E6E0]/60 bg-white shadow-2xl overflow-hidden" align="end" sideOffset={8}>
                   <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <FilterIcon className="size-4 text-[#1A5345]" />
                           <h4 className="font-serif text-[16px] font-bold text-[#1A1F1E]">{ts("advancedFilters")}</h4>
                         </div>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-7 rounded-md px-2 text-[11px] font-bold text-[#6B7870] transition-colors hover:bg-transparent hover:text-[#1A5345]"
                           onClick={resetAdvancedFilters}
                         >
                            {ts("resetAll")}
                         </Button>
                      </div>
                   </div>
                   <div className="p-5 space-y-5 bg-white sm:p-6 sm:space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-[#102F27]">{ts("department")}</Label>
                        <Select 
                          value={advancedFilters.department || FILTER_SELECT_ALL} 
                          onValueChange={(v) => setAdvancedFilters(f => ({ ...f, department: v === FILTER_SELECT_ALL ? "" : v }))}
                        >
                          <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                            <SelectValue placeholder={ts("allDepartments")} />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-[#cfd9d5] bg-white shadow-lg">
                             <SelectItem value={FILTER_SELECT_ALL} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">{ts("allDepartments")}</SelectItem>
                             {departmentOptions.map(d => <SelectItem key={d} value={d} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-[#102F27]">{ts("doctor")}</Label>
                        <Select 
                          value={advancedFilters.doctorName || FILTER_SELECT_ALL} 
                          onValueChange={(v) => setAdvancedFilters(f => ({ ...f, doctorName: v === FILTER_SELECT_ALL ? "" : v }))}
                        >
                          <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                            <SelectValue placeholder={ts("allDoctors")} />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-[#cfd9d5] bg-white shadow-lg">
                             <SelectItem value={FILTER_SELECT_ALL} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">{ts("allDoctors")}</SelectItem>
                             {doctorFilterOptions.map(d => <SelectItem key={d} value={d} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                         <div className="space-y-2">
                            <Label className="text-[12px] font-bold text-[#102F27]">{ts("fromDate")}</Label>
                            <Input 
                              type="date" 
                              value={advancedFilters.dateFrom} 
                              onChange={(e) => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                              className="h-10 rounded-lg border-[#cfd9d5] bg-white text-[#152a24] focus:border-[#d9e5e1] focus:ring-0" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[12px] font-bold text-[#102F27]">{ts("toDate")}</Label>
                            <Input 
                              type="date" 
                              value={advancedFilters.dateTo} 
                              onChange={(e) => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                              className="h-10 rounded-lg border-[#cfd9d5] bg-white text-[#152a24] focus:border-[#d9e5e1] focus:ring-0" 
                            />
                         </div>
                      </div>
                   </div>
                </PopoverContent>
              </Popover>
           </div>
        </div>
      </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-6 pt-4">
        {viewMode === "table" ? (
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse bg-white text-start">
                <thead className="sticky top-0 z-10 bg-[#F4F3ED]/90 shadow-[0_1px_0_0_#E8E6E0] backdrop-blur-md">
                  <tr className="font-serif text-[15px] font-bold text-[#1A1F1E] transition-colors">
                    <th className="py-4 pe-4 ps-4">{ts("tablePatientName")}</th>
                    <th className="py-4 px-4">{ts("tableCondition")}</th>
                    <th className="py-4 px-4">{ts("tableDoctor")}</th>
                    <th className="py-4 px-4">{ts("tableAgeSex")}</th>
                    <th className="py-4 px-4">{ts("tableLastVisit")}</th>
                    <th className="py-4 px-4">{ts("tableStatus")}</th>
                    <th className="py-4 px-4">{ts("tableRiskLevel")}</th>
                    <th className="py-4 ps-4 pe-4 text-end"></th>
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
                            <p className="text-[16px] font-bold">{t("noAppointments")}</p>
                         </div>
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appointment) => (
                      <tr key={appointment.id} className="group cursor-pointer border-t border-[#E8E6E0]/40 transition-colors hover:bg-[#F9F8F5]/50">
                        <td className="py-4 pr-4 pl-4 align-middle">
                          <div className="flex items-start gap-3">
                             <AssistantProfileAvatar
                                name={appointment.patientName}
                                avatarUrl={appointment.patientAvatarUrl}
                                className="size-11 shrink-0 rounded-full border border-[#E8E6E0]/60"
                                sizes="44px"
                                initialsClassName="text-[13px]"
                             />
                             <div className="min-w-0">
                                <p className="truncate font-serif text-[15px] font-bold leading-snug text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
                                  {appointment.patientName}
                                </p>
                                <p className="mt-0.5 text-[12px] font-medium tabular-nums tracking-wide text-muted-foreground">
                                  #{appointment.id.slice(0, 8).toUpperCase()}
                                </p>
                             </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-middle">
                           <p className="text-[14px] font-medium text-[#1A1F1E]/80">{appointment.reason || t("generalCheckup")}</p>
                        </td>
                        <td className="py-4 px-4 align-middle">
                           <div className="flex items-center gap-2.5">
                              <AssistantProfileAvatar
                                 name={appointment.doctorName}
                                 avatarUrl={appointment.doctorAvatarUrl}
                                 className="size-8 shrink-0 rounded-full border border-[#1A5345]/10"
                                 sizes="32px"
                                 initialsClassName="text-[10px]"
                              />
                              <p className="truncate text-[14px] font-bold text-[#1A1F1E]">{appointment.doctorName}</p>
                           </div>
                        </td>
                        <td className="py-4 px-4 align-middle">
                           {(() => {
                             const isMale = !appointment.patientName.toLowerCase().match(/a$/);
                             const age = 30 + (appointment.id.charCodeAt(0) % 25);
                             return (
                               <div className="flex items-center gap-1.5 text-[13px]">
                                  <span className="font-bold tabular-nums text-[#1A1F1E]">{age}</span>
                                  <span className="text-muted-foreground">{ts("yrs")}</span>
                                  <span className="mx-0.5 text-[#E8E6E0]">•</span>
                                  <div className="flex items-center gap-1.5">
                                     <span className={isMale ? "text-blue-500" : "text-pink-500"}>
                                       {isMale ? (
                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><path d="M14 10l5-5"/><path d="M15 5h4v4"/></svg>
                                       ) : (
                                         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><path d="M12 15v7"/><path d="M9 19h6"/></svg>
                                       )}
                                     </span>
                                     <span className="text-[13px] font-medium text-[#1A1F1E]/70">{isMale ? ts("male") : ts("female")}</span>
                                  </div>
                               </div>
                             );
                           })()}
                        </td>
                        <td className="py-4 px-4 align-middle">
                           <span className="text-[14px] font-bold text-[#1A1F1E]">
                             {formatAppointmentDate(appointment.scheduledAt, locale)}
                           </span>
                        </td>
                        <td className="py-4 px-4 align-middle">
                           {(() => {
                              const displayStatus = resolveAppointmentDisplayStatus(appointment);
                              return (
                                 <Badge variant="default" className={cn(
                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                                    DISPLAY_STATUS_STYLES[displayStatus] ?? DISPLAY_STATUS_STYLES.scheduled
                                 )}>
                                    {DISPLAY_STATUS_LABELS[displayStatus]}
                                 </Badge>
                              );
                           })()}
                        </td>
                        <td className="py-4 px-4 align-middle">
                           <Badge variant="default" className={cn(
                             "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                             appointment.visitType === "virtual" 
                               ? "border-0 bg-amber-500 text-white hover:bg-amber-500" 
                               : "border-0 bg-rose-500 text-white hover:bg-rose-500"
                           )}>
                              {appointment.visitType === "virtual" ? ts("riskModerateRisk") : ts("riskHigh")}
                           </Badge>
                        </td>
                        <td className="py-4 pl-4 pr-4 text-right align-middle">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground hover:bg-[#F9F8F5] transition-all opacity-0 group-hover:opacity-100">
                                    <MoreVerticalIcon className="size-5" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[220px] rounded-2xl border-[#E8E6E0]/70 bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                                 <DropdownMenuItem 
                                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-[13px] font-bold text-[#1A1F1E] transition-colors focus:bg-[#F9F8F5] focus:text-[#1A5345]"
                                    onSelect={() => setSelectedAppointment(appointment)}
                                 >
                                    <UserCircle2Icon className="mr-3 size-[18px] opacity-70" />
                                    {t("viewDetails")}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-[13px] font-bold text-[#1A1F1E] transition-colors focus:bg-[#F9F8F5] focus:text-[#1A5345]"
                                    onSelect={() => openEditDialog(appointment)}
                                 >
                                    <PencilLineIcon className="mr-3 size-[18px] opacity-70" />
                                    {t("editSchedule")}
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="mx-1 my-1.5 bg-[#E8E6E0]/60" />
                                 <DropdownMenuItem 
                                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-[13px] font-bold text-emerald-700 transition-colors focus:bg-emerald-50 focus:text-emerald-800 data-[disabled]:opacity-50"
                                    onSelect={() => updateStatus({ appointmentId: appointment.id, status: "completed" })} disabled={appointment.status === 'completed' || isUpdatingStatus}
                                 >
                                    <CalendarCheck2Icon className="mr-3 size-[18px]" />
                                    {t("markCompleted")}
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="mx-1 my-1.5 bg-[#E8E6E0]/60" />
                                 <DropdownMenuItem 
                                    className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-[13px] font-bold text-red-600 transition-colors focus:bg-red-50 focus:text-red-700 data-[disabled]:opacity-50"
                                    onSelect={() => setCancellingAppointment(appointment)} disabled={appointment.status === 'cancelled' || isUpdatingStatus}
                                 >
                                    <XIcon className="mr-3 size-[18px]" />
                                    {t("cancelAppointment")}
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
          <div className="h-full flex flex-col rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] overflow-hidden animate-in zoom-in-95 duration-500">
             {/* Days of week header */}
             <div className="grid grid-cols-7 border-b border-[#E8E6E0]/60 bg-[#F9F8F5]/50">
                {weekdayLabels.map((day, index) => (
                   <div key={index} className="px-4 py-3 text-center text-[12px] font-bold text-muted-foreground uppercase tracking-widest border-e last:border-e-0 border-[#E8E6E0]/40">
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
                                              <AssistantProfileAvatar
                                                name={app.patientName}
                                                avatarUrl={app.patientAvatarUrl}
                                                className={cn(
                                                  "size-8 rounded-full border-2 border-white ring-1 ring-black/5 shadow-sm",
                                                  app.status === "cancelled"
                                                    ? "ring-red-300"
                                                    : "ring-amber-200",
                                                )}
                                                sizes="32px"
                                                initialsClassName="text-[10px]"
                                              />
                                           </button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                          className="w-[240px] p-4 rounded-2xl border-0 shadow-2xl bg-white z-[60]"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                           <div className="flex items-start gap-3">
                                              <AssistantProfileAvatar
                                                 name={app.patientName}
                                                 avatarUrl={app.patientAvatarUrl}
                                                 className="size-10 shrink-0 rounded-full"
                                                 sizes="40px"
                                                 initialsClassName="text-[12px]"
                                              />
                                              <div className="min-w-0">
                                                 <p className="text-[14px] font-bold text-[#1A1F1E] truncate">{app.patientName}</p>
                                                 <p className="text-[11px] font-bold text-muted-foreground mt-0.5">{formatLocalTimeRangeAmPm(app.scheduledAt)} · {app.doctorName}</p>
                                                 {(() => {
                                                    const displayStatus = resolveAppointmentDisplayStatus(app);
                                                    return (
                                                       <Badge variant="default" className={cn(
                                                          "mt-2 rounded-lg px-2 py-0.5 text-[10px]",
                                                          DISPLAY_STATUS_STYLES[displayStatus] ?? DISPLAY_STATUS_STYLES.scheduled
                                                       )}>
                                                          {DISPLAY_STATUS_LABELS[displayStatus]}
                                                       </Badge>
                                                    );
                                                 })()}
                                              </div>
                                           </div>
                                           <div className="mt-4 flex gap-2">
                                              <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] rounded-lg" onClick={() => setSelectedAppointment(app)}>
                                                 {ts("details")}
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
                                    {ts("book")}
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
                                       aria-label={ts("close")}
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
                                           <AssistantProfileAvatar
                                              name={app.patientName}
                                              avatarUrl={app.patientAvatarUrl}
                                              className="size-10 rounded-md border border-[#E8E6E0]"
                                              sizes="40px"
                                              initialsClassName="text-[12px]"
                                           />
                                           <span
                                              className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#1A1F1E] text-white ring-2 ring-white"
                                              title={
                                                 app.visitType === "virtual"
                                                    ? t("virtualVisit")
                                                    : t("clinicVisit")
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
                                                 {app.patientName?.trim() || ts("patient")}
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
      </div>

      {/* Appointment Details Dialog - Premium Medical Design */}
      <Dialog open={Boolean(selectedAppointment && !isEditDialogOpen)} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-[#E8E6E0]/60 bg-white shadow-2xl">
           {selectedAppointment && (
             <div className="flex flex-col">
               {/* Detail Header — compact and premium */}
               <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3">
                        <AssistantProfileAvatar
                           name={selectedAppointment.patientName}
                           avatarUrl={selectedAppointment.patientAvatarUrl}
                           className="size-11 shrink-0 rounded-full border border-[#E8E6E0] shadow-sm"
                           sizes="44px"
                           initialsClassName="text-[13px]"
                        />
                        <div className="min-w-0">
                           <DialogTitle className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                              {selectedAppointment.patientName}
                           </DialogTitle>
                           <p className="mt-0.5 text-[11px] font-bold text-[#6B7870] tabular-nums">
                              #{selectedAppointment.id.slice(0, 8).toUpperCase()}
                           </p>
                        </div>
                     </div>
                     {(() => {
                        const displayStatus = resolveAppointmentDisplayStatus(selectedAppointment);
                        return (
                           <Badge
                              variant="default"
                              className={cn(
                                 "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                                 DISPLAY_STATUS_STYLES[displayStatus] ?? DISPLAY_STATUS_STYLES.scheduled
                              )}
                           >
                              {DISPLAY_STATUS_LABELS[displayStatus]}
                           </Badge>
                        );
                     })()}
                  </div>
               </div>

               {/* Content Sections — matching premium medical style */}
               <div className="space-y-5 px-5 py-5 sm:space-y-6 sm:px-6 sm:py-6">
                  {/* Section 1: Schedule & Physician */}
                  <div className="grid grid-cols-2 gap-x-5 sm:gap-x-8">
                     <div className="relative space-y-0.5 border-l-2 border-[#1A5345]/10 pl-4">
                        <div className="absolute -left-[5px] top-0 size-2 rounded-full bg-[#1A5345]" />
                        <p className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                           {t("schedule")}
                        </p>
                        <p className="text-[14px] font-bold text-[#1A1F1E]">
                           {formatAppointmentDate(selectedAppointment.scheduledAt, locale)}
                        </p>
                        <p className="text-[12px] font-bold text-[#1A5345]">
                           {formatLocalTimeRangeAmPm(selectedAppointment.scheduledAt)}
                        </p>
                     </div>

                     <div className="space-y-0.5">
                        <p className="text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                           {t("practitioner")}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                           <UserIcon className="size-4 text-[#1A5345] shrink-0" />
                           <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold leading-tight text-[#1A1F1E]">
                                 {selectedAppointment.doctorName}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                                 {selectedAppointment.department}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Section 2: Clinical Context */}
                  <div className="space-y-2.5">
                     <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[11px] font-bold uppercase tracking-tight text-[#6B7870]">
                           {t("clinicalContext")}
                        </span>
                        <div className="h-px flex-1 bg-[#E8E6E0]/60" />
                     </div>
                     <div className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                           <ActivityIcon className="size-3.5 text-[#1A5345]" />
                           <p className="text-[11px] font-bold text-[#1A5345]/70">{t("visitReason")}</p>
                        </div>
                        <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                           {selectedAppointment.reason ||
                              t("defaultClinicalContext")}
                        </p>
                     </div>
                  </div>

                  {/* Section 3: Interaction */}
                  <div className="flex items-center gap-2.5 pt-1">
                     <Button
                        variant="ghost"
                        className="h-8 flex-1 rounded-lg font-bold text-[#6B7870] transition-colors hover:bg-slate-50 hover:text-[#1A1F1E]"
                        onClick={() => setSelectedAppointment(null)}
                     >
                        {ts("close")}
                     </Button>
                     <Button
                        asChild
                        className="h-8 flex-[2] rounded-lg bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]"
                     >
                        <Link href={`/assistant-patients/${selectedAppointment.patientId}`}>
                           {t("accessMedicalChart")}
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
                    {ts("patient")}
                  </Label>
                  <AppointmentPersonPicker 
                    items={patientPickerItems}
                    value={editDraft.patientId}
                    onValueChange={(val) => setEditDraft(prev => ({ ...prev, patientId: val }))}
                    placeholder={t("searchPatients")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <User2Icon className="size-3.5 text-muted-foreground" />
                    {ts("doctor")}
                  </Label>
                  <AppointmentPersonPicker 
                    items={doctorPickerItems}
                    value={editDraft.doctorId}
                    onValueChange={(val) => setEditDraft(prev => ({ ...prev, doctorId: val, timeSlot: "" }))}
                    placeholder={t("searchDoctors")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <Building2Icon className="size-3.5 text-muted-foreground" />
                    {t("bookingType")}
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
                      <SelectValue placeholder={t("selectBookingType")} />
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
                      <SelectValue placeholder={t("selectReason")} />
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
                    {t("date")}
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
                    {t("time")}
                  </Label>
                  <Select value={editDraft.timeSlot} onValueChange={(value) => setEditDraft(prev => ({ ...prev, timeSlot: value }))} disabled={!editDraft.date || !editDraft.doctorId}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder={t("chooseSlot")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {editAvailableSlotsQuery.data?.map(slot => <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-10 flex-1 rounded-xl font-bold sm:rounded-2xl">{ts("cancel")}</Button>
                 <Button type="submit" className="h-10 flex-1 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 sm:rounded-2xl" disabled={isUpdatingAppointment}>
                   {isUpdatingAppointment ? t("updating") : t("saveChanges")}
                 </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="space-y-5 bg-white p-5 sm:space-y-6 sm:p-6">
            <div className="flex items-center gap-3">
              <CalendarPlus2Icon className="size-6 text-[#1A5345] shrink-0" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="font-serif text-[18px] font-bold tracking-tight text-[#1A1F1E] sm:text-[20px]">
                  {t("newAppointment")}
                </DialogTitle>
                <DialogDescription className="text-[12px] font-medium text-muted-foreground sm:text-[13px]">
                  Create a clinical booking for an existing patient.
                </DialogDescription>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <UserIcon className="size-3.5 text-muted-foreground" />
                    {ts("patient")}
                  </Label>
                  <AppointmentPersonPicker 
                    items={patientPickerItems}
                    value={bookingDraft.patientId}
                    onValueChange={(val) => setBookingDraft(prev => ({ ...prev, patientId: val }))}
                    placeholder={t("searchPatients")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <User2Icon className="size-3.5 text-muted-foreground" />
                    {ts("doctor")}
                  </Label>
                  <AppointmentPersonPicker 
                    items={doctorPickerItems}
                    value={bookingDraft.doctorId}
                    onValueChange={(val) => setBookingDraft(prev => ({ ...prev, doctorId: val, timeSlot: "" }))}
                    placeholder={t("searchDoctors")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                <div className="min-w-0 space-y-2">
                  <Label className="flex items-center gap-2 text-[13px] font-bold text-[#1A1F1E]">
                    <Building2Icon className="size-3.5 text-muted-foreground" />
                    {t("bookingType")}
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
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                      <SelectValue placeholder={t("selectBookingType")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#cfd9d5] bg-white shadow-lg">
                      {BOOKING_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
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
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                      <SelectValue placeholder={t("selectReason")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#cfd9d5] bg-white shadow-lg">
                      {VISIT_REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
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
                    {t("date")}
                  </Label>
                  <Input 
                    type="date" 
                    value={bookingDraft.date} 
                    onChange={(e) => setBookingDraft(prev => ({ ...prev, date: e.target.value, timeSlot: "" }))} 
                    className="h-10 rounded-lg border-[#cfd9d5] bg-white text-[#152a24] focus:border-[#d9e5e1] focus:ring-0" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1A1F1E] flex items-center gap-2">
                    <ClockIcon className="size-3.5 text-muted-foreground" />
                    {t("time")}
                  </Label>
                  <Select value={bookingDraft.timeSlot} onValueChange={(value) => setBookingDraft(prev => ({ ...prev, timeSlot: value }))} disabled={!bookingDraft.date || !bookingDraft.doctorId}>
                    <SelectTrigger className="h-10 w-full rounded-lg border-[#cfd9d5] bg-white text-[#152a24] hover:border-[#d9e5e1] hover:text-[#1a5345] focus:border-[#d9e5e1] focus:ring-0">
                      <SelectValue placeholder={t("chooseSlot")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-[#cfd9d5] bg-white shadow-lg">
                      {availableSlotsQuery.data?.map(slot => (
                        <SelectItem key={slot.value} value={slot.value} className="cursor-pointer text-[#152a24] hover:bg-[#d9e5e1] hover:text-[#1a5345] h-10">
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <Button 
                   type="button" 
                   variant="ghost" 
                   onClick={() => setIsCreateDialogOpen(false)} 
                   className="h-8 flex-1 rounded-lg font-bold text-[#6B7870] transition-colors hover:bg-slate-50"
                 >
                   {ts("cancel")}
                 </Button>
                 <Button 
                   type="submit" 
                   className="h-8 flex-1 rounded-lg bg-[#1A5345] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]" 
                   disabled={isCreating || !bookingDraft.patientId || !bookingDraft.doctorId || !bookingDraft.date || !bookingDraft.timeSlot || !bookingDraft.reason}
                 >
                   {isCreating ? t("processing") : t("confirmBooking")}
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
                {t("cancelDialogTitle")}
              </DialogTitle>
              <DialogDescription className="text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                {t("cancelFor")}{" "}
                <span className="font-bold text-[#1A1F1E]">{cancellingAppointment?.patientName}</span>? This cannot be
                undone.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 sm:mt-5">
            <Label className="text-[12px] font-bold text-[#1A1F1E] sm:text-[13px]">{t("cancelReason")}</Label>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder={t("cancelReasonPlaceholder")}
              className="min-h-[72px] resize-none rounded-xl border-[#E8E6E0] bg-[#F9F8F5]/50 text-[13px] transition-all focus:bg-white sm:min-h-[80px]"
            />
          </div>
          <div className="mt-4 flex gap-2 sm:mt-5 sm:gap-2.5">
            <Button
              variant="ghost"
              onClick={() => setCancellingAppointment(null)}
              className="h-9 flex-1 rounded-xl text-[12px] font-bold text-muted-foreground sm:h-10 sm:text-[13px]"
            >
              {ts("goBack")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={isUpdatingStatus || !cancellationReason.trim()}
              className="h-9 flex-1 rounded-xl text-[12px] font-bold shadow-md shadow-red-500/10 transition-all hover:-translate-y-0.5 active:translate-y-0 sm:h-10 sm:text-[13px]"
            >
              {t("yesCancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
