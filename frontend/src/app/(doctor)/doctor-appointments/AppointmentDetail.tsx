"use client"

import { useEffect, useState } from "react"
import type { DoctorAppointment, AppointmentStatus } from "./doctorAppointments.types"
import { cn } from "@/lib/utils"
import {
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  StethoscopeIcon,
  VideoIcon,
  XCircleIcon,
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
import { Textarea } from "@/components/ui/textarea"

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  scheduled: "border-0 bg-amber-500 text-white hover:bg-amber-500",
  confirmed: "border-0 bg-blue-500 text-white hover:bg-blue-500",
  completed: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
  cancelled: "border-0 bg-rose-500 text-white hover:bg-rose-500",
}

function getAvatarUrl(name: string, id: string): string {
  const raw = (name.trim() || id || "x").replace(/\s+/g, "")
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(raw)}`
}

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

type AppointmentDetailProps = {
  appointment: DoctorAppointment | null
  onClose: () => void
  onUpdateStatus: (params: { appointmentId: string; status: AppointmentStatus; notes?: string }) => Promise<void>
  onUpdateNotes: (params: { appointmentId: string; notes: string }) => Promise<void>
}

export function AppointmentDetail({
  appointment,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
}: AppointmentDetailProps) {
  const [notes, setNotes] = useState(appointment?.notes ?? "")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    setNotes(appointment?.notes ?? "")
    setShowCancelConfirm(false)
  }, [appointment?.id, appointment?.notes])

  if (!appointment) return null

  const isVirtual = appointment.visitType === "virtual"
  const canTakeAction =
    appointment.status !== "cancelled" && appointment.status !== "completed"
  const isPastSlot = new Date(appointment.scheduledAt) < new Date()
  const status = appointment.status as AppointmentStatus

  const handleSaveNotes = () => {
    onUpdateNotes({ appointmentId: appointment.id, notes })
  }

  const handleConfirm = () => {
    onUpdateStatus({ appointmentId: appointment.id, status: "confirmed" })
    onClose()
  }

  const handleComplete = () => {
    onUpdateStatus({ appointmentId: appointment.id, status: "completed", notes })
    onClose()
  }

  const handleCancel = () => {
    onUpdateStatus({ appointmentId: appointment.id, status: "cancelled" })
    setShowCancelConfirm(false)
    onClose()
  }

  return (
    <Dialog open={!!appointment} onOpenChange={() => onClose()}>
      <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-md">
        <div className="flex flex-col">
          {/* Header — premium medical style (assistant portal reference) */}
          <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <DialogTitle className="font-serif text-[18px] font-bold leading-tight tracking-tight text-[#1A1F1E]">
                    Appointment Details
                  </DialogTitle>
                  <Badge
                    variant="default"
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm",
                      STATUS_STYLES[status] ?? STATUS_STYLES.scheduled,
                    )}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </Badge>
                </div>
                <DialogDescription className="text-[12px] font-medium text-[#6B7870]">
                  Confirmation Code:{" "}
                  <span className="font-mono font-bold text-[#1A5345]">
                    {appointment.confirmationCode}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5 px-5 py-5 sm:space-y-6 sm:px-6 sm:py-6">
            {/* Patient */}
            <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0] bg-[#F9F8F5]/50 p-3.5">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full border border-[#E8E6E0] bg-white shadow-sm">
                <img
                  src={appointment.patient.avatar || getAvatarUrl(appointment.patient.name, appointment.patient.id)}
                  alt=""
                  className="size-full object-cover"
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
                placeholder="Add clinical notes, observations, or treatment plan..."
                className="min-h-[88px] resize-none rounded-xl border-[#E8E6E0] text-[13px] placeholder:text-[#9CA3AF] focus-visible:border-[#1A5345]/40 focus-visible:ring-[#1A5345]/10"
              />
            </div>

            {/* Cancelled Info */}
            {appointment.status === "cancelled" && appointment.cancelledAt && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <AlertTriangleIcon className="size-4 shrink-0 text-red-500" aria-hidden />
                <div>
                  <p className="text-[12px] font-bold text-red-600">Appointment Cancelled</p>
                  <p className="text-[11px] font-medium text-red-400">
                    Cancelled on {formatDateTime(appointment.cancelledAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Cancel Confirmation */}
            {showCancelConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="mb-3 text-[13px] font-bold text-red-700">
                  Are you sure you want to cancel this appointment?
                </p>
                <div className="flex gap-2">
                  <Button
                    className="h-9 flex-1 rounded-lg bg-rose-500 text-[12px] font-bold text-white hover:bg-rose-600"
                    onClick={handleCancel}
                  >
                    Yes, Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 flex-1 rounded-lg border-[#E8E6E0] text-[12px] font-bold"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {canTakeAction && !showCancelConfirm && (
              <div className="flex gap-2.5 pt-1">
                {appointment.status === "scheduled" && (
                  <Button
                    className="h-10 flex-1 gap-1.5 rounded-lg bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                    onClick={handleConfirm}
                  >
                    <CheckCircle2Icon className="size-4" aria-hidden />
                    Confirm
                  </Button>
                )}
                {isPastSlot && appointment.status === "confirmed" && (
                  <Button
                    className="h-10 flex-1 gap-1.5 rounded-lg bg-[#1A5345] text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                    onClick={handleComplete}
                  >
                    <CheckCircle2Icon className="size-4" aria-hidden />
                    Mark Completed
                  </Button>
                )}
                <Button
                  className="h-10 flex-1 gap-1.5 rounded-lg bg-rose-500 text-[12px] font-bold text-white shadow-sm hover:bg-rose-600"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  <XCircleIcon className="size-4" aria-hidden />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
