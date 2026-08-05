"use client"

import type { Medication } from "./medications.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  PillIcon,
  UserRoundIcon,
  RefreshCcwIcon,
} from "lucide-react"
import {
  ComplianceBadge,
  MedicationStatusBadge,
  MedicationTypeBadge,
  TimeOfDayLabel,
} from "./patientMedications.shared"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso))
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
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
        "rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#6B7870] sm:text-[13px]">
        <Icon className="size-4 shrink-0 text-[#1A5345]" aria-hidden />
        {label}
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

type MedicationDetailProps = {
  medication: Medication | null
  onClose: () => void
}

export function MedicationDetail({ medication, onClose }: MedicationDetailProps) {
  if (!medication) return null

  const isActive = medication.status === "active"
  const isPaused = medication.status === "paused"
  const lowRefills = medication.remainingRefills <= 2

  return (
    <Dialog open={!!medication} onOpenChange={() => onClose()}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border-[#E8E6E0]/60 bg-white p-0 shadow-2xl sm:max-w-[510px]">
        <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <PillIcon
              className="size-5 shrink-0 text-[#1A5345] sm:size-[22px]"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <DialogTitle className="text-left font-serif text-[19px] font-bold leading-tight text-[#1A1F1E] sm:text-[21px]">
                {medication.name}
              </DialogTitle>
              <DialogDescription className="text-left text-[14px] font-medium leading-snug text-muted-foreground sm:text-[15px]">
                <span className="font-bold text-[#1A1F1E]">{medication.dose}</span>
                <span className="text-muted-foreground"> · </span>
                {medication.frequency}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex max-h-[min(70vh,520px)] flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <MedicationStatusBadge status={medication.status} size="lg" />
            <MedicationTypeBadge type={medication.type} size="lg" />
            {medication.compliance ? (
              <ComplianceBadge compliance={medication.compliance} size="lg" />
            ) : null}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#E8E6E0] bg-white text-[#1A5345] shadow-sm">
              <UserRoundIcon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[#1A1F1E] sm:text-[16px]">
                {medication.prescribedBy}
              </p>
              <p className="mt-0.5 text-[14px] font-medium text-muted-foreground">
                Prescribed on {formatDate(medication.prescribedAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField icon={ClockIcon} label="Time of day">
              <div className="flex flex-col gap-2">
                {medication.timeOfDay.map((tod) => (
                  <TimeOfDayLabel key={tod} timeOfDay={tod} size="lg" />
                ))}
              </div>
            </DetailField>

            <DetailField icon={RefreshCcwIcon} label="Refills">
              <p className="text-[16px] font-bold tabular-nums text-[#1A1F1E] sm:text-[17px]">
                {medication.remainingRefills} remaining
              </p>
              {lowRefills && (
                <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                  {medication.remainingRefills === 0
                    ? "No refills left — contact your doctor"
                    : "Running low — consider requesting a refill"}
                </p>
              )}
            </DetailField>

            {medication.lastTakenAt && (
              <DetailField icon={CheckCircle2Icon} label="Last taken">
                <p className="text-[15px] font-medium text-[#1A1F1E]">
                  {formatDateTime(medication.lastTakenAt)}
                </p>
              </DetailField>
            )}

            {medication.nextDoseAt && isActive && (
              <DetailField icon={CalendarIcon} label="Next dose">
                <p className="text-[15px] font-medium text-[#1A1F1E]">
                  {formatDateTime(medication.nextDoseAt)}
                </p>
              </DetailField>
            )}
          </div>

          {medication.instructions && (
            <DetailField icon={FileTextIcon} label="Instructions" className="sm:col-span-2">
              <p className="text-[15px] font-medium leading-relaxed text-[#1A1F1E]/90">
                {medication.instructions}
              </p>
            </DetailField>
          )}

          {medication.sideEffects && (
            <DetailField icon={AlertTriangleIcon} label="Side effects">
              <p className="text-[15px] font-medium leading-relaxed text-[#1A1F1E]/90">
                {medication.sideEffects}
              </p>
            </DetailField>
          )}

          {isPaused && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[#E8E6E0]/60 bg-[#F6EFE4] px-3.5 py-3">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-[#9A6B2F]" aria-hidden />
              <p className="text-[14px] font-medium leading-snug text-[#9A6B2F]">
                This medication is paused. Do not resume without your doctor&apos;s approval.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
