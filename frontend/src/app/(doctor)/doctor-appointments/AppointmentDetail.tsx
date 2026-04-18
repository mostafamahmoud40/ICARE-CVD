"use client"

import { useState } from "react"
import type { DoctorAppointment, AppointmentStatus } from "./doctorAppointments.types"
import { cn } from "@/lib/utils"
import {
  Building2Icon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  StethoscopeIcon,
  UserRoundIcon,
  VideoIcon,
  XCircleIcon,
  AlertTriangleIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.scheduled,
      )}
    >
      {status}
    </span>
  )
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
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

  if (!appointment) return null

  const isVirtual = appointment.visitType === "virtual"
  const canTakeAction =
    appointment.status !== "cancelled" && appointment.status !== "completed"
  const isPastSlot = new Date(appointment.scheduledAt) < new Date()

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Appointment Details</span>
            <StatusBadge status={appointment.status} />
          </DialogTitle>
          <DialogDescription>
            Confirmation Code:{" "}
            <span className="font-mono font-bold text-[#1A5345]">
              {appointment.confirmationCode}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Info */}
          <div className="flex items-start gap-3 rounded-lg bg-[#F9F8F5] p-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#E8F0EE]">
              <UserRoundIcon className="size-5 text-[#1A5345]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1A1F1E]">{appointment.patient.name}</p>
              <p className="text-[13px] text-[#6B7870]">
                {appointment.patient.age != null ? `${appointment.patient.age} years` : ""} &middot; {appointment.patient.gender}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <CalendarIcon className="size-3" />
                Date
              </div>
              <p className="mt-1 font-semibold text-[#1A1F1E]">
                {formatDateTime(appointment.scheduledAt).split(" at ")[0]}
              </p>
            </div>
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <ClockIcon className="size-3" />
                Time
              </div>
              <p className="mt-1 font-semibold text-[#1A1F1E]">
                {formatTimeOnly(appointment.scheduledAt)}
              </p>
            </div>
          </div>

          {/* Visit Type */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[#6B7870]">Visit Type:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium",
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
              {isVirtual ? "Virtual Consultation" : "In-Clinic Visit"}
            </span>
          </div>

          {/* Reason */}
          <div className="rounded-lg border border-[#E8E6E0] p-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
              <FileTextIcon className="size-3.5" />
              Reason for Visit
            </div>
            <p className="mt-1 text-[13px] text-[#1A1F1E]">{appointment.reason}</p>
          </div>

          {/* Symptoms */}
          {appointment.symptoms && (
            <div className="rounded-lg border border-[#E8E6E0] p-3">
              <div className="flex items-center gap-1.5 text-[11px] uppercase text-[#6B7870]">
                <StethoscopeIcon className="size-3.5" />
                Reported Symptoms
              </div>
              <p className="mt-1 text-[13px] text-[#1A1F1E]">{appointment.symptoms}</p>
            </div>
          )}

          {/* Clinical Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-[#6B7870]">Clinical Notes</span>
              {appointment.notes && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-[#1A5345]"
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
              className="min-h-[80px] resize-none border-[#E8E6E0] text-[13px] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Cancelled Info */}
          {appointment.status === "cancelled" && appointment.cancelledAt && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangleIcon className="size-4 text-red-500" />
              <div>
                <p className="text-[12px] font-medium text-red-600">Appointment Cancelled</p>
                <p className="text-[11px] text-red-400">
                  Cancelled on {formatDateTime(appointment.cancelledAt)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canTakeAction && !showCancelConfirm && (
          <div className="flex gap-2">
            {appointment.status === "scheduled" && (
              <Button
                className="flex-1 gap-1.5 bg-[#1A5345] hover:bg-[#0F3D32]"
                onClick={handleConfirm}
              >
                <CheckCircle2Icon className="size-4" />
                Confirm
              </Button>
            )}
            {isPastSlot && appointment.status === "confirmed" && (
              <Button
                className="flex-1 gap-1.5 bg-[#1A5345] hover:bg-[#0F3D32]"
                onClick={handleComplete}
              >
                <CheckCircle2Icon className="size-4" />
                Mark Completed
              </Button>
            )}
            <Button
              variant="destructive"
              className="flex-1 gap-1.5"
              onClick={() => setShowCancelConfirm(true)}
            >
              <XCircleIcon className="size-4" />
              Cancel
            </Button>
          </div>
        )}

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-700">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancel}
              >
                Yes, Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelConfirm(false)}
              >
                Go Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
