"use client"

import type { ElementType } from "react"
import Image from "next/image"
import {
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  PaperclipIcon,
  StethoscopeIcon,
  UserRoundIcon,
  VideoIcon,
  BuildingIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Appointment } from "./appointments.types"
import {
  StatusBadge,
  CANCELLED_BY_LABELS,
  CANCELLED_BY_DESCRIPTIONS,
} from "./shared"
import type { AppointmentCancelledBy } from "./appointments.types"
import {
  formatDateMedium,
  formatDateTime,
  formatTimeOnly,
  getAppointmentBookingDisplayStatus,
  isAppointmentManageable,
} from "./appointments.utils"

const CANCELLED_BY_ICONS: Record<AppointmentCancelledBy, ElementType> = {
  patient: UserRoundIcon,
  doctor: StethoscopeIcon,
  clinic: BuildingIcon,
}

function DetailField({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7870]">
        <Icon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  )
}

type AppointmentDetailDialogProps = {
  appointment: Appointment | null
  onClose: () => void
  onReschedule: () => void
  onCancel: (id: string) => void
}

export function AppointmentDetailDialog({
  appointment,
  onClose,
  onReschedule,
  onCancel,
}: AppointmentDetailDialogProps) {
  if (!appointment) return null

  const isVirtual = appointment.visitType === "virtual"
  const displayStatus = getAppointmentBookingDisplayStatus(appointment)
  const canManage = isAppointmentManageable(appointment.status)
  const isCompleted = appointment.status === "completed"
  const isCancelled = appointment.status === "cancelled"
  const visitTitle = appointment.reason?.trim() || appointment.department
  const cancelledBy = appointment.cancelledBy

  return (
    <Dialog open={!!appointment} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[510px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <CalendarIcon
              className="size-5 shrink-0 text-[#1A5345] sm:size-[22px]"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left font-serif text-[17px] font-bold leading-tight text-[#1A1F1E] sm:text-[18px]">
                {visitTitle}
              </DialogTitle>
              <DialogDescription className="text-left text-[12px] font-medium leading-snug text-muted-foreground sm:text-[13px]">
                <span className="font-mono font-bold text-[#00392D]">
                  {appointment.confirmationCode}
                </span>
                <span className="text-muted-foreground"> · </span>
                {formatDateMedium(appointment.scheduledAt)}
                <span className="text-muted-foreground"> · </span>
                {formatTimeOnly(appointment.scheduledAt)}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex max-h-[min(70vh,520px)] flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={displayStatus} />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold",
                isVirtual ? "bg-violet-50 text-violet-700" : "bg-[#E8F0EE] text-[#00392D]",
              )}
            >
              {isVirtual ? (
                <VideoIcon className="size-3.5" aria-hidden />
              ) : (
                <Building2Icon className="size-3.5" aria-hidden />
              )}
              {isVirtual ? "Virtual consultation" : "In-clinic visit"}
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF]">
              <Image
                src={`https://i.pravatar.cc/150?u=${encodeURIComponent(appointment.clinician)}`}
                alt=""
                width={44}
                height={44}
                unoptimized
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[15px] font-bold leading-snug text-[#1A1F1E]">
                {appointment.clinician}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                <StethoscopeIcon className="size-3.5 shrink-0 text-[#1A5345]" aria-hidden />
                {appointment.department}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField icon={CalendarIcon} label="Date">
              <p className="text-[13px] font-medium text-[#1A1F1E]">
                {formatDateMedium(appointment.scheduledAt)}
              </p>
            </DetailField>

            <DetailField icon={ClockIcon} label="Time">
              <p className="text-[13px] font-bold tabular-nums text-[#1A1F1E]">
                {formatTimeOnly(appointment.scheduledAt)}
              </p>
              {appointment.status === "rescheduled" && appointment.rescheduledTo ? (
                <p className="mt-0.5 text-[11px] font-medium text-amber-700">
                  Rescheduled to this slot
                </p>
              ) : null}
            </DetailField>
          </div>

          {appointment.symptoms ? (
            <DetailField icon={FileTextIcon} label="Symptoms">
              <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]/90">
                {appointment.symptoms}
              </p>
            </DetailField>
          ) : null}

          {appointment.attachments && appointment.attachments.length > 0 ? (
            <DetailField icon={PaperclipIcon} label="Attachments">
              <div className="space-y-2">
                {appointment.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-2.5 py-2 text-[13px] font-medium text-[#00392D] transition-colors hover:bg-[#F9F8F5]"
                  >
                    <PaperclipIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{file.name}</span>
                  </a>
                ))}
              </div>
            </DetailField>
          ) : null}

          {appointment.notes && !isCancelled ? (
            <DetailField icon={FileTextIcon} label="Notes">
              <p className="text-[13px] font-medium italic leading-relaxed text-muted-foreground">
                &ldquo;{appointment.notes}&rdquo;
              </p>
            </DetailField>
          ) : null}

          {isCancelled ? (
            <div className="space-y-3 rounded-xl border border-rose-200/70 bg-rose-50/50 p-4">
              {cancelledBy ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/80 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-800">
                  {(() => {
                    const Icon = CANCELLED_BY_ICONS[cancelledBy]
                    return <Icon className="size-3.5 shrink-0" aria-hidden />
                  })()}
                  {CANCELLED_BY_LABELS[cancelledBy]}
                </span>
              ) : null}

              {cancelledBy ? (
                <p className="text-[12px] font-medium leading-snug text-rose-800/90">
                  {CANCELLED_BY_DESCRIPTIONS[cancelledBy]}
                </p>
              ) : (
                <p className="text-[12px] font-medium leading-snug text-rose-800/90">
                  This appointment was cancelled. Contact the clinic if you need more details.
                </p>
              )}

              {appointment.cancellationReason ? (
                <div className="rounded-lg border border-rose-200/60 bg-white/80 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700/80">
                    Reason
                  </p>
                  <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                    {appointment.cancellationReason}
                  </p>
                </div>
              ) : null}

              {appointment.cancelledAt ? (
                <p className="text-[11px] font-medium text-rose-700/80">
                  Cancelled on {formatDateTime(appointment.cancelledAt)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {(canManage || isCompleted || isCancelled) && (
          <div className="flex justify-end gap-2.5 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/50 px-5 py-3 sm:px-6">
            {isCancelled ? (
              <Button
                type="button"
                className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
                onClick={onReschedule}
              >
                Book a new visit
              </Button>
            ) : isCompleted ? (
              <Button
                type="button"
                className="h-8 rounded-lg border-0 bg-[#1A5345] px-5 text-[12px] font-bold text-white shadow-sm hover:bg-[#133F34]"
              >
                View visit report
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-lg border border-[#E8E6E0] bg-white px-4 text-[12px] font-bold text-[#1A1F1E] shadow-sm hover:bg-slate-50 hover:text-[#1A5345]"
                  onClick={onReschedule}
                >
                  Reschedule
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-8 rounded-lg px-4 text-[12px] font-bold shadow-sm"
                  onClick={() => onCancel(appointment.id)}
                >
                  Cancel appointment
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
