"use client"

import { useEffect, useState } from "react"
import type { DoctorAppointment, AppointmentStatus } from "./doctorAppointments.types"
import type { DoctorAvailableSlot } from "./useDoctorAppointments"
import {
  DISPLAY_STATUS_LABELS,
  DISPLAY_STATUS_STYLES,
  isTerminalDisplayStatus,
  resolveAppointmentDisplayStatus,
} from "./appointmentDisplayStatus"
import { cn } from "@/lib/utils"
import {
  Building2Icon,
  CalendarClockIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  StethoscopeIcon,
  VideoIcon,
  AlertTriangleIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PatientAvatar } from "@/components/shared/PatientAvatar"

const STATUS_LABELS = DISPLAY_STATUS_LABELS
const STATUS_STYLES = DISPLAY_STATUS_STYLES

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

function formatDateOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatTimeOnly(iso: string) {
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))
}

function formatLocalDateInput(iso: string) {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatLocalTimeHHMM(iso: string) {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

type AppointmentDetailProps = {
  appointment: DoctorAppointment | null
  onClose: () => void
  onUpdateStatus: (params: { appointmentId: string; status: AppointmentStatus; notes?: string }) => Promise<void>
  onUpdateNotes: (params: { appointmentId: string; notes: string }) => Promise<void>
  onReschedule: (params: { appointmentId: string; scheduledAt: string }) => Promise<void>
  onMarkNoShow: (appointmentId: string) => Promise<void>
  fetchAvailableSlots: (date: string, excludeAppointmentId?: string) => Promise<DoctorAvailableSlot[]>
  isUpdating?: boolean
}

export function AppointmentDetail({
  appointment,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onReschedule,
  onMarkNoShow,
  fetchAvailableSlots,
  isUpdating = false,
}: AppointmentDetailProps) {
  const [notes, setNotes] = useState(appointment?.notes ?? "")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [availableSlots, setAvailableSlots] = useState<DoctorAvailableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  useEffect(() => {
    setNotes(appointment?.notes ?? "")
    setShowCancelConfirm(false)
    setShowReschedule(false)
    setRescheduleError(null)
    if (appointment) {
      setRescheduleDate(formatLocalDateInput(appointment.scheduledAt))
      setRescheduleTime(formatLocalTimeHHMM(appointment.scheduledAt))
    } else {
      setRescheduleDate("")
      setRescheduleTime("")
      setAvailableSlots([])
    }
  }, [appointment?.id, appointment?.notes, appointment?.scheduledAt])

  useEffect(() => {
    if (!showReschedule || !appointment || !rescheduleDate) {
      setAvailableSlots([])
      return
    }

    let cancelled = false
    setSlotsLoading(true)
    setRescheduleError(null)

    void fetchAvailableSlots(rescheduleDate, appointment.id)
      .then((slots) => {
        if (cancelled) return
        setAvailableSlots(slots)
        setRescheduleTime((current) => {
          if (current && slots.some((slot) => slot.value === current)) return current
          return slots[0]?.value ?? ""
        })
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableSlots([])
          setRescheduleError("Could not load available slots for this date.")
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [showReschedule, appointment, rescheduleDate, fetchAvailableSlots])

  if (!appointment) return null

  const isVirtual = appointment.visitType === "virtual"
  const displayStatus = resolveAppointmentDisplayStatus(appointment)
  const canTakeAction = !isTerminalDisplayStatus(displayStatus)
  const canMarkOutcome =
    displayStatus === "overdue" ||
    displayStatus === "waiting" ||
    displayStatus === "arrived" ||
    displayStatus === "report-pending" ||
    displayStatus === "in-consultation" ||
    displayStatus === "scheduled"

  const handleSaveNotes = () => {
    onUpdateNotes({ appointmentId: appointment.id, notes })
  }

  const handleComplete = () => {
    onUpdateStatus({ appointmentId: appointment.id, status: "completed", notes })
    onClose()
  }

  const handleNoShow = async () => {
    await onMarkNoShow(appointment.id)
    onClose()
  }

  const handleCancel = () => {
    onUpdateStatus({ appointmentId: appointment.id, status: "cancelled" })
    setShowCancelConfirm(false)
    onClose()
  }

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return
    setRescheduleError(null)
    try {
      const [year, month, day] = rescheduleDate.split("-").map(Number)
      const [hours, minutes] = rescheduleTime.split(":").map(Number)
      const scheduledAt = new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
      await onReschedule({ appointmentId: appointment.id, scheduledAt })
      setShowReschedule(false)
      onClose()
    } catch {
      setRescheduleError("Could not reschedule this appointment. Pick another slot and try again.")
    }
  }

  return (
    <Dialog open={!!appointment} onOpenChange={() => onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-md">
        <div className="flex flex-col space-y-5 px-5 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <DialogTitle className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                Appointment Details
              </DialogTitle>
              <Badge
                variant="default"
                className={cn(
                  "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                  STATUS_STYLES[displayStatus] ?? STATUS_STYLES.scheduled,
                )}
              >
                {STATUS_LABELS[displayStatus] ?? displayStatus}
              </Badge>
            </div>
            <DialogDescription className="text-[12px] font-medium text-[#6B7870]">
              Confirmation Code:{" "}
              <span className="font-mono font-bold text-[#1A5345]">
                {appointment.confirmationCode}
              </span>
            </DialogDescription>
          </div>

          {/* Patient */}
          <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-3.5">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0] bg-white shadow-sm">
                <PatientAvatar
                  avatarUrl={appointment.patient.avatar}
                  fallbackSeed={appointment.patient.id || appointment.patient.name}
                  alt={appointment.patient.name}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[15px] font-bold text-[#1A1F1E]">
                  {appointment.patient.name}
                </p>
                <p className="text-[12px] font-medium text-[#6B7870]">
                  {appointment.patient.age != null ? `${appointment.patient.age} years` : ""}
                  {appointment.patient.age != null ? " · " : ""}
                  {appointment.patient.gender}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E8E6E0] bg-white p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                  <CalendarIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                  Date
                </div>
                <p className="mt-1.5 font-serif text-[13px] font-bold leading-snug text-[#1A1F1E]">
                  {formatDateOnly(appointment.scheduledAt)}
                </p>
              </div>
              <div className="rounded-xl border border-[#E8E6E0] bg-white p-3.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                  <ClockIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                  Time
                </div>
                <p className="mt-1.5 font-serif text-[13px] font-bold text-[#1A1F1E]">
                  {formatTimeOnly(appointment.scheduledAt)}
                </p>
              </div>
            </div>

            {/* Visit Type */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-[#6B7870]">Visit Type:</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold",
                  isVirtual
                    ? "bg-violet-50 text-violet-600"
                    : "border border-[#A8C4BC]/60 bg-white text-[#1A5345]",
                )}
              >
                {isVirtual ? (
                  <VideoIcon className="size-3" aria-hidden />
                ) : (
                  <Building2Icon className="size-3" aria-hidden />
                )}
                {isVirtual ? "Virtual Consultation" : "In-Clinic Visit"}
              </span>
            </div>

            {/* Reason for Visit */}
            <div className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <FileTextIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Reason for Visit
                </p>
              </div>
              <p className="font-serif text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                {appointment.reason}
              </p>
            </div>

            {/* Symptoms */}
            {appointment.symptoms && (
              <div className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <StethoscopeIcon className="size-3.5 text-[#1A5345]" aria-hidden />
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                    Reported Symptoms
                  </p>
                </div>
                <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                  {appointment.symptoms}
                </p>
              </div>
            )}

            {/* Clinical Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                  Clinical Notes
                </span>
                {notes !== (appointment.notes ?? "") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] font-bold text-[#1A5345] hover:bg-[#E8F0EE] hover:text-[#1A5345]"
                    onClick={handleSaveNotes}
                  >
                    Save
                  </Button>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Add clinical notes, observations, or treatment plan..."
                className="min-h-14 resize-none rounded-xl border-[#E8E6E0] py-2 text-[13px] placeholder:text-[#9CA3AF] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/10"
              />
            </div>

            {displayStatus === "overdue" && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p className="text-[12px] font-medium leading-relaxed">
                  This slot has passed without a recorded outcome. Mark the visit as completed if the patient was seen, or no-show if they did not attend.
                </p>
              </div>
            )}

            {/* Cancelled Info */}
            {(displayStatus === "cancelled" || displayStatus === "no-show") && (
              <div className="flex items-start gap-2 text-red-600">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p className="text-[12px] font-bold">
                    {displayStatus === "no-show" ? "Patient marked as no-show" : "Appointment cancelled"}
                  </p>
                  {appointment.cancelledAt ? (
                    <p className="text-[11px] font-medium text-red-500/90">
                      Cancelled on {formatDateTime(appointment.cancelledAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Reschedule */}
            {showReschedule && (
              <div className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarClockIcon className="size-4 text-[#1A5345]" aria-hidden />
                  <p className="text-[13px] font-bold text-[#1A1F1E]">Reschedule appointment</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                      New date
                    </label>
                    <Input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value)
                        setRescheduleTime("")
                      }}
                      className="h-9 rounded-lg border-[#E8E6E0] text-[13px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-tight text-[#6B7870]">
                      New time
                    </label>
                    <Select
                      value={rescheduleTime}
                      onValueChange={setRescheduleTime}
                      disabled={!rescheduleDate || slotsLoading || availableSlots.length === 0}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-[#E8E6E0] text-[13px]">
                        <SelectValue placeholder={slotsLoading ? "Loading slots..." : "Select time"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {rescheduleError && (
                  <p className="text-[12px] font-medium text-red-600">{rescheduleError}</p>
                )}
                {!slotsLoading && rescheduleDate && availableSlots.length === 0 && (
                  <p className="text-[12px] font-medium text-[#6B7870]">
                    No available slots on this date.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    className="h-8 flex-1 rounded-lg bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                    onClick={() => void handleReschedule()}
                    disabled={isUpdating || !rescheduleDate || !rescheduleTime || availableSlots.length === 0}
                  >
                    Save new time
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 flex-1 rounded-lg text-[12px] font-bold text-[#6B7870] hover:bg-slate-50 hover:text-[#1A1F1E]"
                    onClick={() => {
                      setShowReschedule(false)
                      setRescheduleError(null)
                    }}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel Confirmation */}
            {showCancelConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="mb-3 text-[13px] font-bold text-red-700">
                  Are you sure you want to cancel this appointment?
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="h-8 flex-1 rounded-lg text-[12px] font-bold text-[#6B7870] hover:bg-slate-50 hover:text-[#1A1F1E]"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Go back
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-8 flex-1 rounded-lg text-[12px] font-bold shadow-sm hover:bg-rose-600"
                    onClick={handleCancel}
                  >
                    Yes, cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canTakeAction && !showCancelConfirm && !showReschedule && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {canMarkOutcome && displayStatus !== "in-consultation" && (
                  <Button
                    className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                    onClick={handleComplete}
                    disabled={isUpdating}
                  >
                    Mark completed
                  </Button>
                )}
                {canMarkOutcome && (displayStatus === "overdue" || displayStatus === "waiting" || displayStatus === "arrived") && (
                  <Button
                    variant="outline"
                    className="h-8 rounded-lg border-red-200 px-4 text-[12px] font-bold text-red-600 hover:bg-red-50"
                    onClick={() => void handleNoShow()}
                    disabled={isUpdating}
                  >
                    Mark no-show
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="h-8 rounded-lg px-3 text-[12px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  className="h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                  onClick={() => setShowReschedule(true)}
                  disabled={isUpdating}
                >
                  Reschedule
                </Button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
