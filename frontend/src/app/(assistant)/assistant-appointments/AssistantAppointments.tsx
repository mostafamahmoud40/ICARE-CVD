"use client"

import Link from "next/link"
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  ActivityIcon,
  CalendarPlus2Icon,
  BanIcon,
  Building2Icon,
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
} from "lucide-react"

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
}

const statusLabel: Record<AssistantAppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

/** Matches patient profile appointment row badges (compact pill + shadow), wording stays via `statusLabel`. */
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

/** Preset clinical reasons; stored in `bookingDraft.reason` and sent to the API. */
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

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function exportAppointmentsToCsv(rows: AssistantAppointment[]) {
  const header = [
    "Booking ID",
    "Patient",
    "Doctor",
    "Department",
    "Scheduled",
    "Visit type",
    "Status",
    "Reason",
    "Notes",
  ]
  const lines = [
    header.join(","),
    ...rows.map((a) =>
      [
        escapeCsvCell(a.id),
        escapeCsvCell(String(a.patientName ?? "")),
        escapeCsvCell(String(a.doctorName ?? "")),
        escapeCsvCell(String(a.department ?? "")),
        escapeCsvCell(a.scheduledAt),
        escapeCsvCell(a.visitType),
        escapeCsvCell(a.status),
        escapeCsvCell(String(a.reason ?? "")),
        escapeCsvCell(String(a.notes ?? "")),
      ].join(","),
    ),
  ]
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `icare-appointments-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function downloadVisitBookingFile(a: AssistantAppointment) {
  const scheduled = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(a.scheduledAt))
  const summary =
    a.visitSummary?.trim() ||
    "No clinical summary attached yet — this file contains booking metadata only."
  const body =
    `ICARE-CVD — Visit booking record\r\n` +
    `========================================\r\n` +
    `Booking ID: ${a.id}\r\n` +
    `Status: ${a.status}\r\n` +
    `Patient: ${a.patientName}\r\n` +
    `Doctor: ${a.doctorName}\r\n` +
    `Department: ${a.department}\r\n` +
    `Scheduled: ${scheduled}\r\n` +
    `Visit type: ${a.visitType}\r\n` +
    `Reason: ${a.reason || "—"}\r\n` +
    `Assistant notes: ${a.notes?.trim() || "—"}\r\n\r\n` +
    `Clinical summary:\r\n${summary}\r\n\r\n` +
    `---\r\nGenerated ${new Date().toISOString()}\r\n`

  const blob = new Blob([body], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `visit-booking-${String(a.id).slice(0, 12)}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

function startOfLocalDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function appointmentLocalDayMs(iso: string): number {
  return startOfLocalDayMs(new Date(iso))
}

/** Match list doctor names to row labels (handles "Dr.", spacing, case). */
function normalizeDoctorNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bdr\.?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function enrichAppointmentsWithDoctorId(
  rows: AssistantAppointment[],
  doctors: DoctorOption[],
): AssistantAppointment[] {
  if (!doctors.length) return rows
  const idByNormalizedName = new Map<string, string>()
  for (const d of doctors) {
    const key = normalizeDoctorNameForMatch(String(d.name ?? ""))
    const id = String(d.id ?? "").trim()
    if (key && id && !idByNormalizedName.has(key)) idByNormalizedName.set(key, id)
  }
  return rows.map((a) => {
    const existing = String(a.doctorId ?? "").trim()
    if (existing) return a
    const key = normalizeDoctorNameForMatch(String(a.doctorName ?? ""))
    const resolved = key ? idByNormalizedName.get(key) : undefined
    if (!resolved) return a
    return { ...a, doctorId: resolved }
  })
}

function partitionAppointmentsByDay(appointments: AssistantAppointment[]) {
  const todayStart = startOfLocalDayMs(new Date())
  const today: AssistantAppointment[] = []
  const upcoming: AssistantAppointment[] = []
  const past: AssistantAppointment[] = []

  for (const a of appointments) {
    const day = appointmentLocalDayMs(a.scheduledAt)
    if (day === todayStart) today.push(a)
    else if (day > todayStart) upcoming.push(a)
    else past.push(a)
  }

  const byTime = (x: AssistantAppointment, y: AssistantAppointment) =>
    new Date(x.scheduledAt).getTime() - new Date(y.scheduledAt).getTime()
  const byTimeDesc = (x: AssistantAppointment, y: AssistantAppointment) =>
    new Date(y.scheduledAt).getTime() - new Date(x.scheduledAt).getTime()

  today.sort(byTime)
  upcoming.sort(byTime)
  past.sort(byTimeDesc)

  return { today, upcoming, past }
}

type AppointmentTableRowProps = {
  appointment: AssistantAppointment
  onViewDetails: (a: AssistantAppointment) => void
  isUpdatingStatus: boolean
  isUpdatingAppointment: boolean
  onReschedule: (a: AssistantAppointment) => void
  onEditBooking: (a: AssistantAppointment) => void
  onCancelClick: (a: AssistantAppointment) => void
  onOpenVisitReport: (a: AssistantAppointment) => void
}

/** Dicebear style aligned with patient profile lists (`notionists` + neutral background). */
function clinicianDicebearAvatarSrc(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e8e6e0`
}

function VisitTypeBadge({ visitType }: { visitType: AssistantAppointment["visitType"] }) {
  if (visitType === "virtual") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-violet-200/90 bg-violet-50/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-900 normal-case">
        <VideoIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden />
        Virtual
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[#E8E6E0] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1A1F1E]">
      <Building2Icon className="size-3 shrink-0 text-[#1A5345]/80" strokeWidth={2} aria-hidden />
      In clinic
    </span>
  )
}

function AssistantAppointmentTableRow({
  appointment,
  onViewDetails,
  isUpdatingStatus,
  isUpdatingAppointment,
  onReschedule,
  onEditBooking,
  onCancelClick,
  onOpenVisitReport,
}: AppointmentTableRowProps) {
  const patientName = String(appointment.patientName ?? "").trim() || "Unnamed patient"
  const doctorName = String(appointment.doctorName ?? "").trim() || "Unnamed clinician"
  const patientAvatarSeed = String(appointment.patientName ?? appointment.id ?? "patient").replace(/\s+/g, "")
  const doctorAvatarSeed = String(appointment.doctorName ?? appointment.id ?? "doctor").replace(/\s+/g, "")
  const idPrefix = String(appointment.id ?? "").slice(0, 8).toUpperCase()
  const canReschedule =
    Boolean(appointment.doctorId) &&
    appointment.status !== "cancelled" &&
    appointment.status !== "completed"
  const canEditBooking =
    Boolean(appointment.doctorId) &&
    appointment.status !== "cancelled" &&
    appointment.status !== "completed"

  return (
    <tr className="group hover:bg-[#F9F8F5]/50 transition-colors border-t border-[#E8E6E0]/40 cursor-pointer">
      <td className="py-4 pr-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F4F6]">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patientAvatarSeed)}`}
              alt=""
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-[#1A1F1E] transition-colors group-hover:text-[#1A5345]">
              {patientName}
            </p>
            <p className="mt-0.5 text-[11px] font-bold tracking-tight text-muted-foreground">
              #{idPrefix || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <VisitTypeBadge visitType={appointment.visitType} />
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F3F2F0]">
            <img
              src={clinicianDicebearAvatarSrc(doctorAvatarSeed)}
              alt=""
              className="size-full object-cover"
            />
          </div>
          <p className="truncate text-[14px] font-bold text-[#1A1F1E]">{doctorName}</p>
        </div>
      </td>
      <td className="py-4 px-4 text-[14px] font-medium text-[#1A1F1E]/70">37 / m</td>
      <td className="py-4 px-4">
        <p className="text-[14px] font-medium text-[#1A1F1E]/80">{appointment.reason || "General checkup"}</p>
      </td>
      <td className="py-4 px-4">
        <Badge variant="default" className={cn("rounded-full", appointmentStatusBadgeClass[appointment.status])}>
          {statusLabel[appointment.status]}
        </Badge>
      </td>
      <td className="py-4 pl-4 pr-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-xl text-muted-foreground opacity-0 transition-all hover:bg-[#F9F8F5] group-hover:opacity-100"
            >
              <MoreVerticalIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-[#E8E6E0]/60 p-1.5 shadow-xl">
            <DropdownMenuItem onSelect={() => onViewDetails(appointment)}>
              <UserCircle2Icon className="mr-2.5 size-4" />
              View details
            </DropdownMenuItem>
            {appointment.status === "completed" ? (
              <DropdownMenuItem onSelect={() => onOpenVisitReport(appointment)}>
                <FileTextIcon className="mr-2.5 size-4 text-[#1A5345]" />
                Visit report
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator className="my-1 bg-[#E8E6E0]/60" />
            <DropdownMenuItem
              onSelect={() => onReschedule(appointment)}
              disabled={!canReschedule || isUpdatingStatus || isUpdatingAppointment}
            >
              <CalendarClockIcon className="mr-2.5 size-4 text-[#1A5345]" />
              Reschedule
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onEditBooking(appointment)}
              disabled={!canEditBooking || isUpdatingStatus || isUpdatingAppointment}
            >
              <PencilLineIcon className="mr-2.5 size-4 text-[#1A5345]" />
              Edit booking
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-[#E8E6E0]/60" />
            <DropdownMenuItem
              onSelect={() => onCancelClick(appointment)}
              disabled={
                appointment.status === "cancelled" ||
                appointment.status === "completed" ||
                isUpdatingStatus
              }
              className="text-red-600"
            >
              <XIcon className="mr-2.5 size-4" />
              Cancel appointment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

const APPOINTMENT_SECTION_STYLES = {
  today: {
    row: "border-y border-[#E8E6E0]/45 bg-[#F9F8F5]/45",
    iconWrap: "text-[#1A5345]",
    title: "text-[#1A1F1E]",
    badge: "rounded-md bg-[#E8E6E0]/35 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground",
    Icon: CalendarClockIcon,
  },
  upcoming: {
    row: "border-y border-[#E8E6E0]/45 bg-[#F9F8F5]/45",
    iconWrap: "text-sky-700",
    title: "text-[#1A1F1E]",
    badge: "rounded-md bg-[#E8E6E0]/35 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground",
    Icon: CalendarDaysIcon,
  },
  earlier: {
    row: "border-y border-[#E8E6E0]/45 bg-[#F9F8F5]/45",
    iconWrap: "text-slate-600",
    title: "text-[#1A1F1E]",
    badge: "rounded-md bg-[#E8E6E0]/35 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground",
    Icon: HistoryIcon,
  },
} as const

function AppointmentSectionHeaderRow({
  title,
  count,
  variant,
}: {
  title: string
  count: number
  variant: keyof typeof APPOINTMENT_SECTION_STYLES
}) {
  const cfg = APPOINTMENT_SECTION_STYLES[variant]
  const Icon = cfg.Icon

  return (
    <tr className={cfg.row}>
      <td colSpan={7} className="py-2.5 pl-4 pr-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]",
              cfg.iconWrap,
            )}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={cn("text-[13px] font-semibold sm:text-[14px]", cfg.title)}>{title}</span>
            <span
              className={cn(
                "inline-flex min-w-[1.5rem] items-center justify-center tabular-nums",
                cfg.badge,
              )}
            >
              {count}
            </span>
          </div>
        </div>
      </td>
    </tr>
  )
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
}: AssistantAppointmentsProps) {
  const [selectedPatient, setSelectedPatient] = useState<AssistantAppointment | null>(null)
  const [visitReportTarget, setVisitReportTarget] = useState<AssistantAppointment | null>(null)
  const [detailNotesDraft, setDetailNotesDraft] = useState("")
  const [rescheduleTarget, setRescheduleTarget] = useState<AssistantAppointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("")
  const [editTarget, setEditTarget] = useState<AssistantAppointment | null>(null)
  const [editDoctorId, setEditDoctorId] = useState("")
  const [editVisitType, setEditVisitType] = useState<"clinic" | "virtual">("clinic")
  const [editReason, setEditReason] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [cancellingAppointment, setCancellingAppointment] = useState<AssistantAppointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [bookingDraft, setBookingDraft] = useState({
    patientId: "",
    doctorId: "",
    visitType: "clinic" as "clinic" | "virtual",
    date: "",
    timeSlot: "",
    reason: "",
  })

  const availableSlotsQuery = useAssistantAppointmentAvailableSlots(bookingDraft.doctorId, bookingDraft.date)
  const rescheduleSlotsQuery = useAssistantAppointmentAvailableSlots(
    rescheduleTarget?.doctorId ?? "",
    rescheduleDate,
  )

  const rescheduleSlotItems = useMemo(() => {
    const slots = rescheduleSlotsQuery.data ?? []
    if (!rescheduleTimeSlot) return slots
    if (slots.some((s) => s.value === rescheduleTimeSlot)) return slots
    return [
      {
        value: rescheduleTimeSlot,
        label: `Keep current (${rescheduleTimeSlot})`,
      },
      ...slots,
    ]
  }, [rescheduleSlotsQuery.data, rescheduleTimeSlot])

  useEffect(() => {
    if (selectedPatient) {
      setDetailNotesDraft(selectedPatient.notes ?? "")
    }
  }, [selectedPatient])

  const patientPickerItems = useMemo(
    () =>
      patients.map((p) => {
        const displayName = String(p.name ?? "").trim() || "Unnamed patient"
        const seed = String(p.name ?? p.id ?? "patient").replace(/\s+/g, "")
        return {
          id: String(p.id ?? ""),
          name: displayName,
          subtitle: null,
          searchMatch: String(p.phone ?? "").trim(),
          avatarSrc: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`,
        }
      }),
    [patients],
  )

  const doctorPickerItems = useMemo(
    () =>
      doctors.map((d) => {
        const displayName = String(d.name ?? "").trim() || "Unnamed clinician"
        const seed = String(d.name ?? d.id ?? "doctor").replace(/\s+/g, "")
        return {
          id: String(d.id ?? ""),
          name: displayName,
          subtitle: String(d.specialty ?? "").trim() || "Clinician",
          avatarSrc: clinicianDicebearAvatarSrc(seed),
        }
      }),
    [doctors],
  )

  const appointmentsForUi = useMemo(
    () => enrichAppointmentsWithDoctorId(appointments, doctors),
    [appointments, doctors],
  )

  const { today: todayAppointments, upcoming: upcomingAppointments, past: pastAppointments } = useMemo(
    () => partitionAppointmentsByDay(appointmentsForUi),
    [appointmentsForUi],
  )

  const handleCancelConfirm = async () => {
    if (!cancellingAppointment || !cancellationReason.trim()) return
    await updateStatus({
      appointmentId: cancellingAppointment.id,
      status: "cancelled",
      cancellationReason: cancellationReason.trim(),
    })
    setCancellingAppointment(null)
    setCancellationReason("")
  }

  const handleCreate = async () => {
    if (!bookingDraft.patientId || !bookingDraft.doctorId || !bookingDraft.date || !bookingDraft.timeSlot || !bookingDraft.reason) return
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

    setBookingDraft({
      patientId: "", doctorId: "", visitType: "clinic", date: "", timeSlot: "", reason: "",
    })
    setIsCreateDialogOpen(false)
  }

  const openReschedule = (a: AssistantAppointment) => {
    if (!a.doctorId) {
      showIcareToast({
        title: "Cannot reschedule",
        description: "This booking is missing clinician data. Refresh the page or contact support.",
      })
      return
    }
    setRescheduleTarget(a)
    setRescheduleDate(formatLocalDateInput(a.scheduledAt))
    setRescheduleTimeSlot(formatLocalTimeHHMM(a.scheduledAt))
  }

  const openEditBooking = (a: AssistantAppointment) => {
    if (!a.doctorId) {
      showIcareToast({
        title: "Cannot edit booking",
        description: "Clinician ID is missing for this row.",
      })
      return
    }
    setEditTarget(a)
    setEditDoctorId(a.doctorId)
    setEditVisitType(a.visitType)
    setEditReason(a.reason?.trim() ? a.reason : VISIT_REASON_OPTIONS[0])
  }

  const handleRescheduleSave = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTimeSlot) return
    try {
      const [year, month, day] = rescheduleDate.split("-").map(Number)
      const [hours, minutes] = rescheduleTimeSlot.split(":").map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
      await updateAppointment({
        appointmentId: rescheduleTarget.id,
        payload: { scheduledAt },
      })
      setRescheduleTarget(null)
      showIcareToast({
        title: "Appointment rescheduled",
        icon: CalendarCheck2Icon,
      })
    } catch {
      showIcareToast({
        title: "Could not reschedule",
        description: "Pick another slot or try again.",
      })
    }
  }

  const handleEditBookingSave = async () => {
    if (!editTarget || !editDoctorId || !editReason.trim()) return
    try {
      await updateAppointment({
        appointmentId: editTarget.id,
        payload: {
          doctorId: editDoctorId,
          visitType: editVisitType,
          reason: editReason.trim(),
        },
      })
      setEditTarget(null)
      showIcareToast({
        title: "Booking updated",
        icon: CheckCircle2Icon,
      })
    } catch {
      showIcareToast({
        title: "Update failed",
        description: "Check availability and try again.",
      })
    }
  }

  const handleSaveDetailNotes = async () => {
    if (!selectedPatient) return
    try {
      await updateAppointment({
        appointmentId: selectedPatient.id,
        payload: { notes: detailNotesDraft },
      })
      setSelectedPatient({ ...selectedPatient, notes: detailNotesDraft })
      showIcareToast({
        title: "Notes saved",
        icon: CheckCircle2Icon,
      })
    } catch {
      showIcareToast({
        title: "Could not save notes",
        description: "Try again in a moment.",
      })
    }
  }

  const detailNotesDirty =
    selectedPatient != null && detailNotesDraft !== (selectedPatient.notes ?? "")

  const editReasonOptions = useMemo(() => {
    const base = [...VISIT_REASON_OPTIONS]
    if (editReason && !base.includes(editReason)) {
      return [editReason, ...base]
    }
    return base
  }, [editReason])

  return (
    <div className="flex h-full flex-col bg-[#F9F8F5] overflow-hidden animate-in fade-in duration-500">
      {/* Top Header & Toolbar Area */}
      <div className="shrink-0 bg-white border-b border-[#E8E6E0]/60 relative z-20">
        <div className="flex flex-col px-6 pt-6 pb-4 sm:px-8 sm:pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
            <div className="space-y-1">
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#1A1F1E] font-serif sm:text-[30px] lg:text-[32px]">
                Appointments management
              </h1>
              <p className="text-[14px] font-medium text-muted-foreground sm:text-[15px]">
                Monitor and manage all patient clinical bookings and schedules.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
               <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-[#E8E6E0] bg-white px-5 text-[14px] font-bold text-[#1A1F1E] hover:bg-slate-50 shadow-sm transition-all"
                  onClick={() => {
                    exportAppointmentsToCsv(appointmentsForUi)
                    showIcareToast({
                      title: "Export ready",
                      description: `${appointmentsForUi.length} row(s) — check your downloads.`,
                      icon: DownloadIcon,
                    })
                  }}
               >
                  <DownloadIcon className="size-4 text-muted-foreground" />
                  Export data
               </Button>
               <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="h-11 gap-2 rounded-full bg-[#1A5345] px-6 text-[15px] font-bold text-white hover:bg-[#133F34] shadow-[0_4px_14px_rgba(26,83,69,0.2)] hover:shadow-[0_6px_20px_rgba(26,83,69,0.25)] border-0 transition-colors"
               >
                  <PlusIcon className="size-4.5" strokeWidth={2.5} />
                  New appointment
               </Button>
            </div>
          </div>

          {/* Filters and Stats Summary */}
          <div className="mt-5 flex flex-col items-center justify-between gap-3 pt-2 sm:mt-6 sm:flex-row sm:gap-4">
             <div className="inline-flex max-w-full overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div
                  className="inline-flex shrink-0 divide-x divide-[#E8E6E0] overflow-hidden rounded-xl border border-[#E8E6E0]/80 bg-white shadow-sm"
                  role="tablist"
                  aria-label="Filter by booking status"
                >
                {[
                  { id: "all", label: "All bookings" },
                  { id: "scheduled", label: "Scheduled" },
                  { id: "confirmed", label: "Confirmed" },
                  { id: "completed", label: "Completed" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.id}
                    onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                    className={cn(
                      "flex shrink-0 items-center gap-1 px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap transition-colors sm:px-3 sm:py-2 sm:text-[13px]",
                      statusFilter === tab.id
                        ? "bg-[#1A5345] text-white"
                        : "text-muted-foreground hover:bg-[#F9F8F5] hover:text-[#1A1F1E]"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={cn(
                        "inline-flex min-w-[1.125rem] items-center justify-center rounded px-1 py-px text-[10px] font-semibold tabular-nums sm:text-[11px]",
                        statusFilter === tab.id
                          ? "bg-white/15 text-white"
                          : "bg-black/[0.06] text-muted-foreground"
                      )}
                    >
                      {tab.id === "all" ? counts.total : counts[tab.id as keyof AppointmentStats]}
                    </span>
                  </button>
                ))}
              </div>
           </div>
           
           <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
              <div className="relative flex-1 sm:flex-none sm:w-[280px]">
                <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, doctor, ID, reason, department…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-2xl border-[#E8E6E0] bg-white pl-10 text-[14px] shadow-sm focus-visible:ring-[#1A5345]/20 focus-visible:border-[#1A5345]/40"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="More filters: visit type, clinician, department, date"
                    className="relative size-11 shrink-0 rounded-2xl border-[#E8E6E0] bg-white text-muted-foreground shadow-sm hover:text-[#1A1F1E]"
                  >
                    <FilterIcon className="size-4.5" />
                    {hasActiveAdvancedFilters ? (
                      <span
                        className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-[#1A5345] ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(100vw-2rem,22rem)] space-y-4 p-5 rounded-2xl border-[#E8E6E0]/60 shadow-xl" align="end">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1A1F1E] font-serif">Advanced filters</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Narrow the list without changing status tabs.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold text-[#1A1F1E]">Visit type</Label>
                      <Select
                        value={advancedFilters.visitType}
                        onValueChange={(v) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            visitType: v as AssistantAppointmentAdvancedFilters["visitType"],
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                          <SelectValue placeholder="All visit types" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All visit types</SelectItem>
                          <SelectItem value="clinic">In clinic</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold text-[#1A1F1E]">Clinician</Label>
                      <Select
                        value={
                          advancedFilters.doctorName.trim()
                            ? advancedFilters.doctorName
                            : FILTER_SELECT_ALL
                        }
                        onValueChange={(v) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            doctorName: v === FILTER_SELECT_ALL ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                          <SelectValue placeholder="All clinicians" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={FILTER_SELECT_ALL}>All clinicians</SelectItem>
                          {doctorFilterOptions.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold text-[#1A1F1E]">Department</Label>
                      <Select
                        value={
                          advancedFilters.department.trim()
                            ? advancedFilters.department
                            : FILTER_SELECT_ALL
                        }
                        onValueChange={(v) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            department: v === FILTER_SELECT_ALL ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                          <SelectValue placeholder="All departments" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={FILTER_SELECT_ALL}>All departments</SelectItem>
                          {departmentOptions.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold text-[#1A1F1E]">Scheduled date</Label>
                      <Select
                        value={advancedFilters.dateScope}
                        onValueChange={(v) =>
                          setAdvancedFilters((prev) => ({
                            ...prev,
                            dateScope: v as AssistantAppointmentAdvancedFilters["dateScope"],
                          }))
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] bg-white text-[14px]">
                          <SelectValue placeholder="All dates" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="past">Earlier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-xl border-[#E8E6E0] text-[14px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]"
                      onClick={resetAdvancedFilters}
                    >
                      Clear filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
           </div>
        </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8 relative">
        <div className="w-full h-full pb-6 pt-4">
          <div className="rounded-2xl border border-[#E8E6E0]/70 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px] bg-white">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[15px] font-serif font-bold text-[#1A5345]/90 bg-[#F4F3ED]/90 backdrop-blur-md shadow-[0_1px_0_0_#E8E6E0] transition-colors">
                  <th className="py-4 pr-4 pl-4">Patient Name</th>
                  <th className="py-4 px-4">Visit type</th>
                  <th className="py-4 px-4">Doctor</th>
                  <th className="py-4 px-4">Age / Sex</th>
                  <th className="py-4 px-4">Condition</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 pl-4 pr-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E0]/40">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-4 px-4">
                          <Skeleton className="h-5 w-full rounded-md" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : appointmentsForUi.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-20 text-center">
                       <div className="flex flex-col items-center justify-center opacity-40">
                          <CalendarClockIcon className="size-12 mb-4" strokeWidth={1.5} />
                          <p className="text-[16px] font-bold">No appointments found</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {todayAppointments.length > 0 ? (
                      <>
                        <AppointmentSectionHeaderRow
                          title="Today's appointments"
                          count={todayAppointments.length}
                          variant="today"
                        />
                        {todayAppointments.map((appointment) => (
                          <AssistantAppointmentTableRow
                            key={appointment.id}
                            appointment={appointment}
                            onViewDetails={setSelectedPatient}
                            isUpdatingStatus={isUpdatingStatus}
                            isUpdatingAppointment={isUpdatingAppointment}
                            onReschedule={openReschedule}
                            onEditBooking={openEditBooking}
                            onCancelClick={setCancellingAppointment}
                            onOpenVisitReport={setVisitReportTarget}
                          />
                        ))}
                      </>
                    ) : null}
                    {upcomingAppointments.length > 0 ? (
                      <>
                        <AppointmentSectionHeaderRow
                          title="Upcoming appointments"
                          count={upcomingAppointments.length}
                          variant="upcoming"
                        />
                        {upcomingAppointments.map((appointment) => (
                          <AssistantAppointmentTableRow
                            key={appointment.id}
                            appointment={appointment}
                            onViewDetails={setSelectedPatient}
                            isUpdatingStatus={isUpdatingStatus}
                            isUpdatingAppointment={isUpdatingAppointment}
                            onReschedule={openReschedule}
                            onEditBooking={openEditBooking}
                            onCancelClick={setCancellingAppointment}
                            onOpenVisitReport={setVisitReportTarget}
                          />
                        ))}
                      </>
                    ) : null}
                    {pastAppointments.length > 0 ? (
                      <>
                        <AppointmentSectionHeaderRow
                          title="Earlier"
                          count={pastAppointments.length}
                          variant="earlier"
                        />
                        {pastAppointments.map((appointment) => (
                          <AssistantAppointmentTableRow
                            key={appointment.id}
                            appointment={appointment}
                            onViewDetails={setSelectedPatient}
                            isUpdatingStatus={isUpdatingStatus}
                            isUpdatingAppointment={isUpdatingAppointment}
                            onReschedule={openReschedule}
                            onEditBooking={openEditBooking}
                            onCancelClick={setCancellingAppointment}
                            onOpenVisitReport={setVisitReportTarget}
                          />
                        ))}
                      </>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

      {/* Dialogs and Modals - Keep functionality but style like premium */}
      <Dialog open={Boolean(selectedPatient)} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
           {selectedPatient && (
             <>
               <div className="bg-[#1A5345] p-8 text-white">
                  <div className="flex items-center gap-4">
                     <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                        <UserIcon className="size-8 text-white" />
                     </div>
                     <div>
                        <DialogTitle className="text-[24px] font-bold font-serif">{selectedPatient.patientName}</DialogTitle>
                        <p className="text-white/70 text-[14px]">Patient booking details</p>
                     </div>
                  </div>
               </div>
               <div className="p-8 grid grid-cols-2 gap-6 bg-white">
                  <div className="space-y-1">
                     <p className="text-[11px] font-bold text-muted-foreground">Booking ID</p>
                     <p className="text-[15px] font-bold text-[#1A1F1E] font-mono">{selectedPatient.id.slice(0, 12).toUpperCase()}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[11px] font-bold text-muted-foreground">Status</p>
                     <Badge variant="default" className={cn("rounded-full", appointmentStatusBadgeClass[selectedPatient.status])}>
                       {statusLabel[selectedPatient.status]}
                     </Badge>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[11px] font-bold text-muted-foreground">Doctor</p>
                     <p className="text-[15px] font-bold text-[#1A1F1E]">{selectedPatient.doctorName}</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[11px] font-bold text-muted-foreground">Specialty</p>
                     <p className="text-[15px] font-bold text-[#1A1F1E]">{selectedPatient.department}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                     <p className="text-[11px] font-bold text-muted-foreground">Scheduled</p>
                     <p className="text-[15px] font-bold text-[#1A1F1E]">
                       {new Intl.DateTimeFormat("en-US", {
                         dateStyle: "medium",
                         timeStyle: "short",
                       }).format(new Date(selectedPatient.scheduledAt))}
                     </p>
                  </div>
                  <div className="col-span-2 space-y-1 pt-2">
                     <p className="text-[11px] font-bold text-muted-foreground">Visit reason</p>
                     <p className="text-[14px] leading-relaxed text-[#1A1F1E] bg-[#F9F8F5] p-4 rounded-xl border border-[#E8E6E0]/60">{selectedPatient.reason || "No reason provided."}</p>
                  </div>
                  <div className="col-span-2 space-y-2 pt-2">
                     <Label htmlFor="appointment-detail-notes" className="text-[11px] font-bold text-muted-foreground">
                       Assistant notes
                     </Label>
                     <Textarea
                       id="appointment-detail-notes"
                       value={detailNotesDraft}
                       onChange={(e) => setDetailNotesDraft(e.target.value)}
                       placeholder="Internal notes for staff (not shown to patient)…"
                       rows={4}
                       disabled={selectedPatient.status === "completed"}
                       className="rounded-xl border-[#E8E6E0] bg-[#FAFAF8] text-[14px] disabled:opacity-70"
                     />
                  </div>
                  <div className="col-span-2 flex flex-wrap justify-end gap-3 pt-4">
                     <Button variant="outline" className="rounded-xl h-11 px-6 font-bold" onClick={() => setSelectedPatient(null)}>
                       Close
                     </Button>
                     {selectedPatient.status === "completed" ? (
                       <Button
                         type="button"
                         variant="outline"
                         className="rounded-xl h-11 px-6 font-bold border-[#1A5345]/30 text-[#1A5345] hover:bg-[#E8F0EE]"
                         onClick={() => setVisitReportTarget(selectedPatient)}
                       >
                         <FileTextIcon className="mr-2 size-4" />
                         Visit report
                       </Button>
                     ) : null}
                     <Button
                       type="button"
                       variant="outline"
                       className="rounded-xl h-11 px-6 font-bold border-[#1A5345]/30 text-[#1A5345] hover:bg-[#E8F0EE]"
                       disabled={selectedPatient.status === "completed" || !detailNotesDirty || isUpdatingAppointment}
                       onClick={() => void handleSaveDetailNotes()}
                     >
                       {isUpdatingAppointment ? "Saving…" : "Save notes"}
                     </Button>
                     {selectedPatient.patientId ? (
                       <Button asChild className="rounded-xl h-11 px-6 bg-[#1A5345] font-bold hover:bg-[#133F34]">
                         <Link href={`/assistant-patients/${selectedPatient.patientId}`}>Full profile</Link>
                       </Button>
                     ) : null}
                  </div>
               </div>
             </>
           )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(visitReportTarget)} onOpenChange={(open) => !open && setVisitReportTarget(null)}>
        <DialogContent className="overflow-hidden rounded-3xl border-[#E8E6E0]/80 sm:max-w-lg">
          {visitReportTarget ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl text-[#1A1F1E]">Visit report</DialogTitle>
                <DialogDescription className="text-[14px] font-medium">
                  Completed visit record for{" "}
                  <span className="font-semibold text-[#1A1F1E]">{visitReportTarget.patientName}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E8E6E0]/70 bg-[#F9F8F5]/80 p-4 text-[13px]">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Booking</p>
                    <p className="font-mono font-semibold text-[#1A1F1E]">
                      {visitReportTarget.id.slice(0, 12).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Clinician</p>
                    <p className="font-semibold text-[#1A1F1E]">{visitReportTarget.doctorName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Scheduled</p>
                    <p className="font-semibold text-[#1A1F1E]">
                      {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(visitReportTarget.scheduledAt))}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground">Clinical summary</Label>
                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-[#E8E6E0]/70 bg-white p-4 text-[14px] leading-relaxed text-[#1A1F1E]">
                    {visitReportTarget.visitSummary?.trim() ||
                      "No clinical summary is linked to this booking yet. When the backend attaches visit notes or a PDF link, they will appear here. You can still download a booking metadata file below."}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {visitReportTarget.visitReportUrl ? (
                    <Button asChild className="rounded-xl bg-[#1A5345] font-bold hover:bg-[#133F34]">
                      <a href={visitReportTarget.visitReportUrl} target="_blank" rel="noopener noreferrer">
                        <SquareArrowOutUpRightIcon className="mr-2 size-4" />
                        Open full report
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl font-semibold"
                    onClick={() => downloadVisitBookingFile(visitReportTarget)}
                  >
                    <DownloadIcon className="mr-2 size-4" />
                    Download booking file
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl font-semibold"
                    onClick={() => setVisitReportTarget(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null)
        }}
      >
        <DialogContent className="rounded-3xl border-[#E8E6E0]/80 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#1A1F1E]">Reschedule appointment</DialogTitle>
            <DialogDescription className="text-[14px] font-medium">
              Pick a new date and time for the same clinician. Only available slots are listed.
            </DialogDescription>
          </DialogHeader>
          {rescheduleTarget ? (
            <div className="space-y-4 py-2">
              <p className="text-[13px] text-muted-foreground">
                Patient:{" "}
                <span className="font-semibold text-[#1A1F1E]">{rescheduleTarget.patientName}</span>
              </p>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value)
                    setRescheduleTimeSlot("")
                  }}
                  className="h-11 rounded-xl border-[#E8E6E0]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Time</Label>
                <Select
                  value={rescheduleTimeSlot}
                  onValueChange={setRescheduleTimeSlot}
                  disabled={!rescheduleDate || !rescheduleTarget.doctorId}
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0]">
                    <SelectValue placeholder={rescheduleDate ? "Choose slot" : "Pick a date first"} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {rescheduleSlotItems.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setRescheduleTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-[#1A5345] font-bold hover:bg-[#133F34]"
                  disabled={
                    !rescheduleDate ||
                    !rescheduleTimeSlot ||
                    isUpdatingAppointment ||
                    rescheduleSlotsQuery.isLoading
                  }
                  onClick={() => void handleRescheduleSave()}
                >
                  {isUpdatingAppointment ? "Saving…" : "Save new time"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      >
        <DialogContent className="max-h-[min(90vh,560px)] overflow-y-auto rounded-3xl border-[#E8E6E0]/80 sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#1A1F1E]">Edit booking</DialogTitle>
            <DialogDescription className="text-[14px] font-medium">
              Change clinician, visit type, or clinical reason. Availability is validated when you save.
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#1A1F1E]">Clinician</Label>
                <AppointmentPersonPicker
                  value={editDoctorId}
                  onValueChange={(id) => {
                    setEditDoctorId(id)
                  }}
                  items={doctorPickerItems}
                  placeholder="Select doctor"
                  searchPlaceholder="Search doctors…"
                  emptyText="No doctors found"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#1A1F1E]">Visit type</Label>
                <Select
                  value={editVisitType}
                  onValueChange={(v) => setEditVisitType(v as "clinic" | "virtual")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="clinic">In clinic</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold text-[#1A1F1E]">Visit reason</Label>
                <Select value={editReason} onValueChange={setEditReason}>
                  <SelectTrigger className="h-11 rounded-xl border-[#E8E6E0] text-left">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(280px,50vh)] rounded-xl">
                    {editReasonOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-[14px] leading-snug">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditTarget(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-[#1A5345] font-bold hover:bg-[#133F34]"
                  disabled={!editDoctorId || !editReason.trim() || isUpdatingAppointment}
                  onClick={() => void handleEditBookingSave()}
                >
                  {isUpdatingAppointment ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden rounded-[28px] border border-[#E8E6E0]/80 p-0 shadow-2xl sm:max-w-[560px]">
          <div className="shrink-0 border-b border-[#E8E6E0]/70 bg-[#FAFAF8] px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0EE] text-[#1A5345] ring-1 ring-[#1A5345]/10 sm:size-14">
                <CalendarPlus2Icon className="size-6 sm:size-7" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 pr-8">
                <DialogTitle className="text-left text-[22px] font-bold leading-tight tracking-tight text-[#102F27] font-serif sm:text-[24px]">
                  New appointment
                </DialogTitle>
                <DialogDescription className="text-left text-[15px] font-medium leading-snug text-muted-foreground">
                  Create a clinical booking for an existing patient.
                </DialogDescription>
              </div>
            </div>
          </div>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreate()
            }}
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white px-6 py-6 sm:px-8 sm:py-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2.5 text-[14px] font-bold text-[#1A1F1E]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345]">
                      <UserIcon className="size-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    Patient
                  </Label>
                  <AppointmentPersonPicker
                    value={bookingDraft.patientId}
                    onValueChange={(id) => setBookingDraft((prev) => ({ ...prev, patientId: id }))}
                    items={patientPickerItems}
                    placeholder="Select patient"
                    searchPlaceholder="Search patients…"
                    emptyText="No patients found"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2.5 text-[14px] font-bold text-[#1A1F1E]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345]">
                      <UserCircle2Icon className="size-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    Doctor
                  </Label>
                  <AppointmentPersonPicker
                    value={bookingDraft.doctorId}
                    onValueChange={(id) => setBookingDraft((prev) => ({ ...prev, doctorId: id, timeSlot: "" }))}
                    items={doctorPickerItems}
                    placeholder="Select doctor"
                    searchPlaceholder="Search doctors…"
                    emptyText="No doctors found"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2.5 text-[14px] font-bold text-[#1A1F1E]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345]">
                      <CalendarIcon className="size-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={bookingDraft.date}
                    onChange={(e) => setBookingDraft((prev) => ({ ...prev, date: e.target.value, timeSlot: "" }))}
                    className="h-12 rounded-xl border-[#E5EEEA] bg-white px-3.5 text-[15px] font-medium text-[#1A1F1E] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-[15px] file:font-medium placeholder:text-muted-foreground/80 focus-visible:ring-[#1A5345]/20"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="flex items-center gap-2.5 text-[14px] font-bold text-[#1A1F1E]">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345]">
                      <ClockIcon className="size-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    Time
                  </Label>
                  <Select
                    value={bookingDraft.timeSlot}
                    onValueChange={(value) => setBookingDraft((prev) => ({ ...prev, timeSlot: value }))}
                    disabled={!bookingDraft.date || !bookingDraft.doctorId}
                  >
                    <SelectTrigger
                      className="h-12 w-full rounded-xl border-[#E5EEEA] bg-white px-3.5 text-left text-[15px] font-medium text-[#1A1F1E] shadow-sm transition-colors hover:border-[#1A5345]/25 focus:ring-[#1A5345]/20 disabled:cursor-not-allowed disabled:border-[#E8E6E0]/80 disabled:bg-[#F9F8F5] disabled:text-muted-foreground/70 data-[placeholder]:text-muted-foreground/80"
                    >
                      <SelectValue placeholder={!bookingDraft.doctorId || !bookingDraft.date ? "Pick doctor & date first" : "Choose slot"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#E8E6E0]/80 shadow-xl">
                      {availableSlotsQuery.data?.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value} className="cursor-pointer rounded-lg py-2.5 text-[15px]">
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="flex items-center gap-2.5 text-[14px] font-bold text-[#1A1F1E]">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[#1A5345]">
                    <ActivityIcon className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  Visit reason
                </Label>
                <Select
                  value={bookingDraft.reason}
                  onValueChange={(value) => setBookingDraft((prev) => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border-[#E5EEEA] bg-white px-3.5 text-left text-[15px] font-medium text-[#1A1F1E] shadow-sm transition-colors hover:border-[#1A5345]/25 focus:ring-[#1A5345]/20 data-[placeholder]:text-muted-foreground/80">
                    <SelectValue placeholder="Select visit reason" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(280px,50vh)] rounded-xl border-[#E8E6E0]/80 shadow-xl">
                    {VISIT_REASON_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option} className="cursor-pointer rounded-lg py-2.5 text-[15px] leading-snug">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="shrink-0 border-t border-[#E8E6E0]/70 bg-[#FAFAF8] px-6 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="h-12 rounded-xl border-[#E5EEEA] bg-white px-6 text-[15px] font-semibold text-[#1A1F1E] shadow-sm hover:bg-[#F9F8F5] sm:min-w-[120px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-12 rounded-xl bg-[#1A5345] px-6 text-[15px] font-bold text-white shadow-md shadow-[#1A5345]/20 transition-colors hover:bg-[#133F34] sm:min-w-[180px]"
                  disabled={
                    isCreating ||
                    !bookingDraft.patientId ||
                    !bookingDraft.doctorId ||
                    !bookingDraft.date ||
                    !bookingDraft.timeSlot ||
                    !bookingDraft.reason
                  }
                >
                  {isCreating ? "Processing..." : "Confirm booking"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancellation Dialog */}
      <Dialog open={Boolean(cancellingAppointment)} onOpenChange={(open) => !open && setCancellingAppointment(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-0 shadow-2xl">
          <DialogHeader className="space-y-3">
             <div className="size-14 rounded-2xl bg-red-50 flex items-center justify-center mb-2">
                <BanIcon className="size-8 text-red-500" />
             </div>
             <DialogTitle className="text-[22px] font-bold text-[#1A1F1E]">Cancel appointment?</DialogTitle>
             <DialogDescription className="text-[14px] font-medium">
                Confirm cancellation for <span className="text-[#1A1F1E] font-bold">{cancellingAppointment?.patientName}</span>.
             </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1A1F1E]">Reason</Label>
                <Textarea value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} placeholder="Provide reason..." className="rounded-xl bg-[#F9F8F5]/50" rows={3} />
             </div>
          </div>
          <div className="flex gap-3">
             <Button variant="ghost" onClick={() => setCancellingAppointment(null)} className="flex-1 rounded-xl h-11 font-bold text-muted-foreground">Go back</Button>
             <Button variant="destructive" onClick={handleCancelConfirm} disabled={isUpdatingStatus || !cancellationReason.trim()} className="flex-1 rounded-xl h-11 font-bold">Confirm cancellation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
