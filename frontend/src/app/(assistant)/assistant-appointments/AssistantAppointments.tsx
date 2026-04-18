"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ActivityIcon,
  CalendarPlus2Icon,
  BanIcon,
  Building2Icon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CheckIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SquareArrowOutUpRightIcon,
  UserCircle2Icon,
  VideoIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

import type {
  AssistantAppointment,
  AssistantAppointmentStatus,
  AppointmentStats,
  DoctorOption,
  PatientOption,
} from "./assistantAppointments.types"
import { useAssistantAppointmentAvailableSlots } from "./useAssistantAppointments"

type AssistantAppointmentsProps = {
  appointments: AssistantAppointment[]
  totalAppointments: number
  counts: AppointmentStats
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: AssistantAppointmentStatus | "all"
  setStatusFilter: (value: AssistantAppointmentStatus | "all") => void
  isLoading: boolean
  isError: boolean
  error: Error | null
  updateStatus: (payload: { appointmentId: string; status: AssistantAppointmentStatus }) => Promise<void>
  isUpdatingStatus: boolean
  createAppointment: (payload: {
    patientId: string
    doctorId: string
    scheduledAt: string
    visitType: "clinic" | "virtual"
    reason: string
  }) => Promise<void>
  isCreating: boolean
  doctors: DoctorOption[]
  patients: PatientOption[]
}

const statusLabel: Record<AssistantAppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusStyles: Record<AssistantAppointmentStatus, string> = {
  scheduled: "bg-amber-500/10 text-amber-700",
  confirmed: "bg-blue-500/10 text-blue-700",
  completed: "bg-emerald-500/10 text-emerald-700",
  cancelled: "bg-red-500/10 text-red-700",
}

const statCardStyles = {
  all: {
    icon: CalendarClockIcon,
    iconWrap: "bg-[#E8F0EE] text-[#00392D]",
    delta: "+12%",
    deltaStyle: "bg-[#E8F0EE] text-[#1A5345]",
    spark: "bg-[#1A5345]/80",
  },
  scheduled: {
    icon: ActivityIcon,
    iconWrap: "bg-[#F6EFE4] text-[#9A6B2F]",
    delta: "+4%",
    deltaStyle: "bg-[#F6EFE4] text-[#9A6B2F]",
    spark: "bg-[#C58A4B]/80",
  },
  confirmed: {
    icon: CheckCircle2Icon,
    iconWrap: "bg-[#E8F0EE] text-[#1A5345]",
    delta: "+8%",
    deltaStyle: "bg-[#E8F0EE] text-[#1A5345]",
    spark: "bg-[#2C7A68]/75",
  },
  completed: {
    icon: CalendarCheck2Icon,
    iconWrap: "bg-[#EDF3F1] text-[#2F6A5D]",
    delta: "+15%",
    deltaStyle: "bg-[#EDF3F1] text-[#2F6A5D]",
    spark: "bg-[#3B7D6F]/75",
  },
  cancelled: {
    icon: BanIcon,
    iconWrap: "bg-[#F8EDEE] text-[#A24B4B]",
    delta: "-3%",
    deltaStyle: "bg-[#F8EDEE] text-[#A24B4B]",
    spark: "bg-[#C97070]/75",
  },
} as const

function formatAppointmentDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatAppointmentTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
  }).format(new Date(value))
}

function AppointmentRow({
  appointment,
  onUpdateStatus,
  isUpdating,
  onOpenPatientDetails,
}: {
  appointment: AssistantAppointment
  onUpdateStatus: (payload: { appointmentId: string; status: AssistantAppointmentStatus }) => void
  isUpdating: boolean
  onOpenPatientDetails: (appointment: AssistantAppointment) => void
}) {
  const isVirtual = appointment.visitType === "virtual"

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="px-4 py-4 align-top">
        <div className="space-y-1">
          <p className="font-mono text-xs font-medium text-[#00392D]">{appointment.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{appointment.patientName}</p>
          <p className="text-xs text-muted-foreground">{appointment.department}</p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="space-y-0.5 text-center">
          <p className="text-[11px] font-medium uppercase text-muted-foreground">
            {new Date(appointment.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
          </p>
          <p className="text-lg font-bold leading-none text-foreground">
            {new Date(appointment.scheduledAt).getDate()}
          </p>
        </div>
      </td>

      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
            isVirtual
              ? "border-violet-200 bg-violet-50 text-violet-600"
              : "border-[#A8C4BC] bg-[#E8F0EE] text-[#00392D]"
          }`}
        >
          {isVirtual ? <VideoIcon className="size-3" /> : <Building2Icon className="size-3" />}
          {isVirtual ? "Virtual" : "In-Clinic"}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        <p className="text-sm text-foreground">{formatAppointmentTime(appointment.scheduledAt)}</p>
      </td>

      <td className="max-w-52 px-4 py-4 align-top text-sm text-muted-foreground">
        {appointment.reason || appointment.patientPhone}
      </td>

      <td className="px-4 py-4 align-top">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}
        >
          {statusLabel[appointment.status]}
        </span>
      </td>

      <td className="px-4 py-4 align-top">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" disabled={isUpdating} aria-label="Open row actions">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => onOpenPatientDetails(appointment)}>
                <UserCircle2Icon className="size-4" />
                View patient details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={appointment.status === "confirmed"}
                onSelect={() => onUpdateStatus({ appointmentId: appointment.id, status: "confirmed" })}
              >
                <CheckIcon className="size-4" />
                Confirm booking
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={appointment.status === "completed"}
                onSelect={() => onUpdateStatus({ appointmentId: appointment.id, status: "completed" })}
              >
                <CalendarCheck2Icon className="size-4" />
                Mark as completed
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                disabled={appointment.status === "cancelled"}
                onSelect={() => onUpdateStatus({ appointmentId: appointment.id, status: "cancelled" })}
              >
                <XIcon className="size-4" />
                Cancel booking
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

export function AssistantAppointments({
  appointments,
  totalAppointments,
  counts,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isLoading,
  isError,
  error,
  updateStatus,
  isUpdatingStatus,
  createAppointment,
  isCreating,
  doctors,
  patients,
}: AssistantAppointmentsProps) {
  const [selectedPatient, setSelectedPatient] = useState<AssistantAppointment | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [bookingDraft, setBookingDraft] = useState({
    patientId: "",
    doctorId: "",
    visitType: "clinic" as "clinic" | "virtual",
    date: "",
    timeSlot: "",
    reason: "",
  })

  const selectedPatientOption = patients.find((p) => p.id === bookingDraft.patientId)
  const selectedDoctorOption = doctors.find((d) => d.id === bookingDraft.doctorId)
  const availableSlotsQuery = useAssistantAppointmentAvailableSlots(bookingDraft.doctorId, bookingDraft.date)

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
      patientId: "",
      doctorId: "",
      visitType: "clinic",
      date: "",
      timeSlot: "",
      reason: "",
    })
    setIsCreateDialogOpen(false)
  }

  return (
    <main className="w-full space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Appointments Management</h1>
        <p className="text-sm text-muted-foreground">
          View patient bookings by name and manage confirmation, completion, and cancellation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${statCardStyles.all.iconWrap}`}>
                <statCardStyles.all.icon className="size-4" />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statCardStyles.all.deltaStyle}`}>
                {statCardStyles.all.delta}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">All bookings</p>
              <p className="text-2xl font-semibold">{counts.total}</p>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[10, 14, 9, 18, 12, 20, 16].map((h, idx) => (
                <span key={idx} className={`w-1.5 rounded ${statCardStyles.all.spark}`} style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${statCardStyles.scheduled.iconWrap}`}>
                <statCardStyles.scheduled.icon className="size-4" />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statCardStyles.scheduled.deltaStyle}`}>
                {statCardStyles.scheduled.delta}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-semibold">{counts.scheduled}</p>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[8, 11, 9, 7, 13, 10, 12].map((h, idx) => (
                <span key={idx} className={`w-1.5 rounded ${statCardStyles.scheduled.spark}`} style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${statCardStyles.confirmed.iconWrap}`}>
                <statCardStyles.confirmed.icon className="size-4" />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statCardStyles.confirmed.deltaStyle}`}>
                {statCardStyles.confirmed.delta}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-semibold">{counts.confirmed}</p>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[6, 7, 11, 12, 9, 14, 15].map((h, idx) => (
                <span key={idx} className={`w-1.5 rounded ${statCardStyles.confirmed.spark}`} style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${statCardStyles.completed.iconWrap}`}>
                <statCardStyles.completed.icon className="size-4" />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statCardStyles.completed.deltaStyle}`}>
                {statCardStyles.completed.delta}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-2xl font-semibold">{counts.completed}</p>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[4, 6, 8, 12, 14, 16, 18].map((h, idx) => (
                <span key={idx} className={`w-1.5 rounded ${statCardStyles.completed.spark}`} style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-9 items-center justify-center rounded-xl ${statCardStyles.cancelled.iconWrap}`}>
                <statCardStyles.cancelled.icon className="size-4" />
              </div>
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statCardStyles.cancelled.deltaStyle}`}>
                {statCardStyles.cancelled.delta}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-semibold">{counts.cancelled}</p>
            </div>
            <div className="flex h-8 items-end gap-1">
              {[12, 11, 10, 8, 7, 5, 4].map((h, idx) => (
                <span key={idx} className={`w-1.5 rounded ${statCardStyles.cancelled.spark}`} style={{ height: `${h * 2}px` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative w-full md:max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              className="h-8 border-[#E8E6E0] bg-white pl-9 text-[13px] placeholder:text-[#9CA3AF]"
            />
          </div>
          <div className="flex flex-wrap gap-1 md:ml-auto">
            {(
              [
                { value: "all", label: "All" },
                { value: "scheduled", label: "Scheduled" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-[#00392D] text-white"
                    : "bg-[#E8E6E0]/50 text-[#6B7870] hover:bg-[#E8E6E0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button
            className="gap-2 rounded-full bg-[#00392D] px-6 md:ml-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <CalendarPlus2Icon className="size-4" />
            Add Appointment
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 pt-5">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load appointments</AlertTitle>
          <AlertDescription>{error?.message ?? "Unexpected error while loading data."}</AlertDescription>
        </Alert>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No bookings found for the selected filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#F9F8F5] text-[11px] uppercase tracking-wider text-[#6B7870]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Patient</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Visit Type</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onUpdateStatus={(payload) => { updateStatus(payload) }}
                    isUpdating={isUpdatingStatus}
                    onOpenPatientDetails={setSelectedPatient}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selectedPatient)} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-xl">
          {selectedPatient ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPatient.patientName}</DialogTitle>
                <DialogDescription>Patient booking profile for assistant review.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p className="mt-1 font-mono font-medium">{selectedPatient.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusStyles[selectedPatient.status]}`}
                  >
                    {statusLabel[selectedPatient.status]}
                  </span>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="mt-1 font-medium">{selectedPatient.doctorName}</p>
                  <p className="text-xs text-muted-foreground">{selectedPatient.department}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Scheduled at</p>
                  <p className="mt-1 font-medium">{formatAppointmentDate(selectedPatient.scheduledAt)}</p>
                  <p className="text-xs capitalize text-muted-foreground">{selectedPatient.visitType}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="mt-1 font-medium">{selectedPatient.patientPhone ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="mt-1 font-medium">{selectedPatient.patientEmail}</p>
                </div>
                <div className="rounded-lg border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Visit reason</p>
                  <p className="mt-1">{selectedPatient.reason}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={`/assistant-patients?search=${encodeURIComponent(selectedPatient.patientName)}`}>
                    <SquareArrowOutUpRightIcon className="size-4" />
                    View patient profile
                  </Link>
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add appointment</DialogTitle>
            <DialogDescription>
              Create a new booking for an existing patient.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              handleCreate()
            }}
          >
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select
                value={bookingDraft.patientId}
                onValueChange={(value) => setBookingDraft((prev) => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select existing patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPatientOption ? (
                <p className="text-xs text-muted-foreground">Phone: {selectedPatientOption.phone ?? "—"}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select
                value={bookingDraft.doctorId}
                onValueChange={(value) => setBookingDraft((prev) => ({ ...prev, doctorId: value, timeSlot: "" }))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDoctorOption ? (
                <p className="text-xs text-muted-foreground">Department: {selectedDoctorOption.specialty ?? "Cardiology"}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={bookingDraft.date}
                  onChange={(event) => setBookingDraft((prev) => ({ ...prev, date: event.target.value, timeSlot: "" }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Select
                  value={bookingDraft.timeSlot}
                  onValueChange={(value) => setBookingDraft((prev) => ({ ...prev, timeSlot: value }))}
                  disabled={!bookingDraft.date || !bookingDraft.doctorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!bookingDraft.date ? "Choose date first" : !bookingDraft.doctorId ? "Choose doctor first" : "Select available slot"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlotsQuery.isLoading ? (
                      <SelectItem value="loading-slot" disabled>
                        Loading available slots...
                      </SelectItem>
                    ) : availableSlotsQuery.isError ? (
                      <SelectItem value="error-slot" disabled>
                        Failed to load slots
                      </SelectItem>
                    ) : (availableSlotsQuery.data?.length ?? 0) > 0 ? (
                      availableSlotsQuery.data!.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-slot" disabled>
                        No available slots
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visit type</Label>
              <Select
                value={bookingDraft.visitType}
                onValueChange={(value) =>
                  setBookingDraft((prev) => ({ ...prev, visitType: value as "clinic" | "virtual" }))
                }
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">In-Clinic</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                value={bookingDraft.reason}
                onChange={(event) => setBookingDraft((prev) => ({ ...prev, reason: event.target.value }))}
                placeholder="Describe the reason for visit..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#00392D] hover:bg-[#00392D]/90"
                disabled={isCreating || !bookingDraft.patientId || !bookingDraft.doctorId || !bookingDraft.date || !bookingDraft.timeSlot || !bookingDraft.reason}
              >
                {isCreating ? "Creating..." : "Create booking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}
