"use client"

import {
  MoonIcon,
  SunriseIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  MedicationCompliance,
  MedicationStatus,
  MedicationType,
  TimeOfDay,
} from "./medications.types"

export const TYPE_LABELS: Record<string, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

const TIME_ICONS: Record<TimeOfDay, LucideIcon> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
}

const VIBRANT_BADGE_BASE =
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border-transparent whitespace-nowrap border-0 font-bold text-white shadow-none transition-[color,box-shadow] hover:opacity-100"

const TYPE_BADGE_COLORS: Record<MedicationType, string> = {
  antihypertensives: "bg-rose-500 hover:bg-rose-500",
  antiplatelets: "bg-violet-600 hover:bg-violet-600",
  anticoagulants: "bg-red-600 hover:bg-red-600",
  statins: "bg-emerald-500 hover:bg-emerald-500",
  antiarrhythmics: "bg-amber-500 hover:bg-amber-500",
  diuretics: "bg-sky-500 hover:bg-sky-500",
  diabetes_medications: "bg-orange-500 hover:bg-orange-500",
}

const TIME_BADGE_COLORS: Record<TimeOfDay, string> = {
  morning: "bg-amber-500 hover:bg-amber-500",
  afternoon: "bg-sky-500 hover:bg-sky-500",
  evening: "bg-violet-600 hover:bg-violet-600",
}

const TIME_ICON_COLORS: Record<TimeOfDay, string> = {
  morning: "text-amber-500",
  afternoon: "text-sky-500",
  evening: "text-violet-500",
}

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
}

const STATUS_BADGE_COLORS: Record<MedicationStatus, string> = {
  active: "bg-emerald-500 hover:bg-emerald-500",
  paused: "bg-amber-500 hover:bg-amber-500",
  discontinued: "bg-slate-500 hover:bg-slate-500",
}

const COMPLIANCE_BADGE_COLORS: Record<MedicationCompliance, string> = {
  good: "bg-emerald-500 hover:bg-emerald-500",
  poor: "bg-rose-500 hover:bg-rose-500",
}

type BadgeSize = "sm" | "md" | "lg"

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "rounded-lg px-2 py-0.5 text-[10px]",
  md: "rounded-lg px-2.5 py-0.5 text-[11px]",
  lg: "rounded-lg px-3 py-1 text-[13px]",
}

export function MedicationTypeBadge({
  type,
  size = "sm",
  className,
}: {
  type: MedicationType
  size?: BadgeSize
  className?: string
}) {
  return (
    <Badge
      variant="default"
      className={cn(
        VIBRANT_BADGE_BASE,
        SIZE_CLASSES[size],
        TYPE_BADGE_COLORS[type],
        className,
      )}
    >
      {TYPE_LABELS[type] ?? type}
    </Badge>
  )
}

export function TimeOfDayBadge({
  timeOfDay,
  size = "sm",
  className,
}: {
  timeOfDay: TimeOfDay
  size?: BadgeSize
  className?: string
}) {
  const Icon = TIME_ICONS[timeOfDay]

  return (
    <Badge
      variant="default"
      className={cn(
        VIBRANT_BADGE_BASE,
        SIZE_CLASSES[size],
        TIME_BADGE_COLORS[timeOfDay],
        className,
      )}
    >
      <Icon className={cn("size-3", size === "lg" && "size-3.5")} aria-hidden />
      {TIME_LABELS[timeOfDay]}
    </Badge>
  )
}

/** Icon + label without badge background — for detail panels and read-only views. */
export function TimeOfDayLabel({
  timeOfDay,
  size = "md",
  className,
}: {
  timeOfDay: TimeOfDay
  size?: BadgeSize
  className?: string
}) {
  const Icon = TIME_ICONS[timeOfDay]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold text-[#1A1F1E]",
        size === "lg" ? "text-[14px] sm:text-[15px]" : size === "md" ? "text-[13px]" : "text-[12px]",
        className,
      )}
    >
      <Icon
        className={cn(
          TIME_ICON_COLORS[timeOfDay],
          size === "lg" ? "size-4" : size === "md" ? "size-3.5" : "size-3",
        )}
        strokeWidth={2.25}
        aria-hidden
      />
      {TIME_LABELS[timeOfDay]}
    </span>
  )
}

export function MedicationStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: MedicationStatus
  size?: BadgeSize
  className?: string
}) {
  return (
    <Badge
      variant="default"
      className={cn(
        VIBRANT_BADGE_BASE,
        SIZE_CLASSES[size],
        "capitalize",
        STATUS_BADGE_COLORS[status],
        className,
      )}
    >
      {status}
    </Badge>
  )
}

export function ComplianceBadge({
  compliance,
  size = "md",
  className,
}: {
  compliance: MedicationCompliance
  size?: BadgeSize
  className?: string
}) {
  const label = compliance === "good" ? "Good compliance" : "Poor compliance"

  return (
    <Badge
      variant="default"
      className={cn(
        VIBRANT_BADGE_BASE,
        SIZE_CLASSES[size],
        COMPLIANCE_BADGE_COLORS[compliance],
        className,
      )}
    >
      {label}
    </Badge>
  )
}
