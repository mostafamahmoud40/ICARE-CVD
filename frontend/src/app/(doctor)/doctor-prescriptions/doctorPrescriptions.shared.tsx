"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RiskTier } from "@/app/(assistant)/assistant-medications/assistantMedications.types"
import type { PrescriptionStatus, PrescriptionType } from "./doctorPrescriptions.types"

export const TYPE_LABELS: Record<PrescriptionType, string> = {
  antihypertensives: "Anti-hypertensives",
  antiplatelets: "Antiplatelets",
  anticoagulants: "Anticoagulants",
  statins: "Statins",
  antiarrhythmics: "Antiarrhythmics",
  diuretics: "Diuretics",
  diabetes_medications: "Diabetes",
}

export const medicationSnapshotCardClassName =
  "rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"

export function MedicationSnapshotCard({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1", medicationSnapshotCardClassName, className)}>
      <p className="text-[11px] font-medium text-[#6B7870]">{label}</p>
      {children}
    </div>
  )
}

export function AdherencePill({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, pct))
  const color = safe >= 85 ? "bg-emerald-500" : safe >= 65 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#E8E6E0]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${safe}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{safe}%</span>
    </div>
  )
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  const cfg = {
    active: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
    paused: "border-0 bg-amber-500 text-white hover:bg-amber-500",
    discontinued: "border-0 bg-slate-400 text-white hover:bg-slate-400",
  }[status]

  return (
    <Badge variant="default" className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold capitalize", cfg)}>
      {status}
    </Badge>
  )
}

export function prescriptionsListSearchInputClassName() {
  return "h-10 w-full rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] pl-10 pr-4 text-[13px] font-medium text-[#1A1F1E] shadow-none transition-[border-color,background-color,box-shadow] placeholder:font-medium placeholder:text-muted-foreground/55 focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-11 sm:pl-11 sm:text-[14px]"
}

export function prescriptionsScrollbarCss() {
  return `
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
  `
}

export function formatPatientRowId(internalId: string) {
  const raw = internalId.replace(/^#/, "").trim()
  return `#${raw.toUpperCase()}`
}

export function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(dateValue),
  )
}

export function formatDateTime(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateValue))
}

export function MedicationDots({ history }: { history: boolean[] }) {
  return (
    <div className="flex items-center gap-1">
      {history.map((taken, index) => (
        <div
          key={index}
          className={cn(
            "size-2.5 rounded-full border",
            taken ? "border-emerald-600 bg-emerald-500" : "border-rose-200 bg-rose-50",
          )}
          title={taken ? "Taken" : "Missed"}
        />
      ))}
    </div>
  )
}

export function RiskBadge({ tier }: { tier: RiskTier }) {
  const cfg = {
    high: "border-0 bg-rose-500 text-white hover:bg-rose-500",
    medium: "border-0 bg-amber-500 text-white hover:bg-amber-500",
    low: "border-0 bg-emerald-500 text-white hover:bg-emerald-500",
  }[tier]

  return (
    <Badge variant="default" className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold", cfg)}>
      {tier} risk
    </Badge>
  )
}
