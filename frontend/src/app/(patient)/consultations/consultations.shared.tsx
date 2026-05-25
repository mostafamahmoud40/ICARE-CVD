import {
  ActivityIcon,
  Building2Icon,
  HeartIcon,
  HeartPulseIcon,
  ScaleIcon,
  VideoIcon,
  WindIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type {
  ConsultationRecordStatus,
  ConsultationVisitType,
  Medication,
  VitalMetric,
} from "./consultations.types"

export function ConsultationVisitTypeBadge({
  visitType,
  className,
}: {
  visitType: ConsultationVisitType
  className?: string
}) {
  if (visitType === "virtual") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-violet-200/90 bg-violet-50/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-900 normal-case",
          className,
        )}
      >
        <VideoIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden />
        Virtual
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[#E8E6E0] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1A1F1E]",
        className,
      )}
    >
      <Building2Icon className="size-3 shrink-0 text-[#1A5345]/80" strokeWidth={2} aria-hidden />
      In clinic
    </span>
  )
}

export const CONSULTATION_RECORD_STATUS_LABELS: Record<ConsultationRecordStatus, string> = {
  "report-ready": "Report ready",
  "pending-report": "Report pending",
  updated: "Report updated",
}

export const CONSULTATION_RECORD_STATUS_STYLES: Record<ConsultationRecordStatus, string> = {
  "report-ready": "bg-emerald-500 text-white",
  "pending-report": "bg-amber-500 text-white",
  updated: "bg-[#3B82F6] text-white",
}

export function ConsultationRecordStatusBadge({
  status,
  className,
}: {
  status: ConsultationRecordStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold",
        CONSULTATION_RECORD_STATUS_STYLES[status],
        className,
      )}
    >
      {CONSULTATION_RECORD_STATUS_LABELS[status]}
    </span>
  )
}

const VITAL_STATUS_ICON_COLOR: Record<VitalMetric["status"], string> = {
  normal: "text-[#1A5345]",
  elevated: "text-amber-600",
  warning: "text-orange-600",
  critical: "text-rose-600",
}

function vitalStatIcon(label: string): LucideIcon {
  const key = label.toLowerCase()
  if (key.includes("blood") || key.includes("pressure")) return HeartPulseIcon
  if (key.includes("heart") || key.includes("rate")) return HeartIcon
  if (key.includes("weight")) return ScaleIcon
  if (key.includes("spo") || key.includes("oxygen")) return WindIcon
  return ActivityIcon
}

export const VISIT_MEDICATION_STATUS_LABELS: Record<Medication["status"], string> = {
  ongoing: "Ongoing",
  increased: "Dose increased",
  decreased: "Dose reduced",
  new: "New",
  discontinued: "Stopped",
}

export const VISIT_MEDICATION_STATUS_STYLES: Record<Medication["status"], string> = {
  ongoing: "bg-[#6B7870] text-white",
  increased: "bg-amber-500 text-white",
  decreased: "bg-[#3B82F6] text-white",
  new: "bg-violet-600 text-white",
  discontinued: "bg-rose-500 text-white",
}

export function VisitMedicationStatusBadge({
  status,
  className,
}: {
  status: Medication["status"]
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold",
        VISIT_MEDICATION_STATUS_STYLES[status],
        className,
      )}
    >
      {VISIT_MEDICATION_STATUS_LABELS[status]}
    </span>
  )
}

/** Maps visit vitals to QueueStatCell props (patient queue tile style). */
export function getVisitVitalStatProps(vital: VitalMetric) {
  const statusLabel = vital.status.charAt(0).toUpperCase() + vital.status.slice(1)

  return {
    icon: vitalStatIcon(vital.label),
    value: vital.unit ? `${vital.value} ${vital.unit}` : vital.value,
    label: vital.label,
    hint: vital.note ? `${statusLabel} · ${vital.note}` : statusLabel,
    iconColor: VITAL_STATUS_ICON_COLOR[vital.status],
    highlight: vital.status !== "normal",
  }
}
