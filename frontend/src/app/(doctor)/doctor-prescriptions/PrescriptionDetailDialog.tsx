"use client"

import type { PatientPrescription } from "./doctorPrescriptions.types"
import { cn } from "@/lib/utils"
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  MoonIcon,
  PencilLineIcon,
  PillIcon,
  PlayIcon,
  SunriseIcon,
  SunIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { deriveAdherenceHistory7d } from "./doctorPrescriptionsClinical.mock"
import {
  AdherencePill,
  MedicationDots,
  PrescriptionStatusBadge,
  TYPE_LABELS,
} from "./doctorPrescriptions.shared"

const TIME_ICONS: Record<string, React.ElementType> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  )
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

type PrescriptionDetailDialogProps = {
  prescription: PatientPrescription | null
  onClose: () => void
  onEdit?: (prescription: PatientPrescription) => void
  onReactivate?: (prescription: PatientPrescription) => void
}

function DetailBlock({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string
  icon: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#E8E6E0]/60 bg-white p-3.5 shadow-sm",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="size-3.5 text-[#1A5345]" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B7870]">{label}</span>
      </div>
      {children}
    </div>
  )
}

export function PrescriptionDetailDialog({
  prescription,
  onClose,
  onEdit,
  onReactivate,
}: PrescriptionDetailDialogProps) {
  if (!prescription) return null

  const history7d = deriveAdherenceHistory7d(prescription.adherencePercent)

  return (
    <Dialog open={!!prescription} onOpenChange={() => onClose()}>
      <DialogContent
        className="flex max-h-[min(90vh,680px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-[#E8E6E0]/70 bg-white p-0 shadow-2xl sm:max-w-md"
        showCloseButton
      >
        <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-[#F9F8F5] px-5 py-4 pr-12 sm:px-6">
          <div className="flex items-start gap-3">
            <PillIcon className="mt-0.5 size-5 shrink-0 text-[#1A5345]" aria-hidden />
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="font-serif text-[18px] font-bold leading-tight text-[#1A1F1E]">
                {prescription.name}
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-[#6B7870]">
                {prescription.dose} · {prescription.frequency}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <PrescriptionStatusBadge status={prescription.status} />
                <Badge
                  variant="outline"
                  className="rounded-lg border-[#E8E6E0] bg-white text-[10px] font-bold text-[#6B7870]"
                >
                  {TYPE_LABELS[prescription.type] ?? prescription.type}
                </Badge>
                <Badge
                  className={cn(
                    "rounded-lg border-0 text-[10px] font-bold",
                    prescription.compliance === "good"
                      ? "bg-emerald-500 text-white hover:bg-emerald-500"
                      : "bg-amber-500 text-white hover:bg-amber-500",
                  )}
                >
                  {prescription.compliance === "good" ? "Good compliance" : "Poor compliance"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-5 sm:p-6">
            <DetailBlock label="7-day adherence" icon={CheckCircle2Icon}>
              <div className="flex flex-col gap-2">
                <MedicationDots history={history7d} />
                <div className="flex items-center justify-between gap-3">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E8E6E0]">
                    <div
                      className={cn(
                        "h-full rounded-full bg-emerald-500",
                        prescription.adherencePercent < 85 && "bg-amber-500",
                        prescription.adherencePercent < 65 && "bg-rose-500",
                      )}
                      style={{ width: `${prescription.adherencePercent}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[14px] font-bold tabular-nums text-[#1A1F1E]">
                    {prescription.adherencePercent}%
                  </span>
                </div>
                <AdherencePill pct={prescription.adherencePercent} />
              </div>
            </DetailBlock>

            <div className="grid grid-cols-2 gap-3">
              <DetailBlock label="Prescribed" icon={CalendarIcon}>
                <p className="text-[13px] font-bold text-[#1A1F1E]">
                  {formatDate(prescription.prescribedAt)}
                </p>
              </DetailBlock>
              <DetailBlock label="Time of day" icon={ClockIcon}>
                <div className="flex flex-wrap gap-1.5">
                  {prescription.timeOfDay.map((tod) => {
                    const Icon = TIME_ICONS[tod]
                    return (
                      <span
                        key={tod}
                        className="inline-flex items-center gap-1 rounded-md bg-[#E8F0EE] px-2 py-0.5 text-[11px] font-bold text-[#1A5345]"
                      >
                        <Icon className="size-3" aria-hidden />
                        {tod.charAt(0).toUpperCase() + tod.slice(1)}
                      </span>
                    )
                  })}
                </div>
              </DetailBlock>
            </div>

            {prescription.lastTakenAt ? (
              <DetailBlock label="Last taken by patient" icon={CheckCircle2Icon}>
                <p className="text-[13px] font-medium text-[#1A1F1E]">
                  {formatDateTime(prescription.lastTakenAt)}
                </p>
              </DetailBlock>
            ) : null}

            {prescription.instructions ? (
              <DetailBlock label="Instructions" icon={FileTextIcon}>
                <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                  {prescription.instructions}
                </p>
              </DetailBlock>
            ) : null}

            {prescription.sideEffects ? (
              <DetailBlock label="Known side effects" icon={AlertTriangleIcon}>
                <p className="text-[13px] font-medium leading-relaxed text-[#1A1F1E]">
                  {prescription.sideEffects}
                </p>
              </DetailBlock>
            ) : null}

            {prescription.status === "paused" ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-3">
                <p className="text-[12px] font-medium text-amber-800">
                  This prescription is paused. The patient should not resume without your approval.
                </p>
              </div>
            ) : null}

            {prescription.status === "discontinued" ? (
              <div className="rounded-xl border border-[#E8E6E0] bg-[#F9F8F5] px-3.5 py-3">
                <p className="text-[12px] font-medium text-[#6B7870]">
                  This prescription was discontinued. You can reactivate it to make it active again.
                </p>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <div className="flex shrink-0 gap-2 border-t border-[#E8E6E0]/60 bg-[#F9F8F5]/80 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 rounded-lg border-[#E8E6E0] bg-white text-[12px] font-bold text-[#1A1F1E] hover:bg-[#F9F8F5]"
            onClick={onClose}
          >
            Close
          </Button>
          {prescription.status === "discontinued" || prescription.status === "paused" ? (
            onReactivate ? (
              <Button
                type="button"
                size="sm"
                className="h-9 flex-1 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
                onClick={() => onReactivate(prescription)}
              >
                <PlayIcon className="size-3.5" aria-hidden />
                {prescription.status === "discontinued" ? "Reactivate" : "Resume"}
              </Button>
            ) : null
          ) : onEdit ? (
            <Button
              type="button"
              size="sm"
              className="h-9 flex-1 gap-1.5 rounded-lg border-0 bg-[#1A5345] text-[12px] font-bold text-white hover:bg-[#133F34]"
              onClick={() => onEdit(prescription)}
            >
              <PencilLineIcon className="size-3.5" aria-hidden />
              Edit prescription
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
