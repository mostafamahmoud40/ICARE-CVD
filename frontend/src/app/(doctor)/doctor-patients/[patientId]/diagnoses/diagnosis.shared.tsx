"use client"

import type { ElementType, ReactNode } from "react"
import type { DiagnosisRecord, VisitRecord } from "../../doctorPatients.types"
import { cn } from "@/lib/utils"
import type { DiagnosisFormValues } from "./diagnosisForm.types"

export function fmtShort(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "\u2014"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
}

export function yesNoLabel(value: boolean) {
  return value ? "Yes" : "No"
}

export function doctorAvatarUrl(name: string) {
  const seed = name.replace(/^Dr\.\s*/i, "").replace(/\s+/g, "") || name
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
}

export function DiagnosedByCell({ name }: { name: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#E8F0EE]">
        <img src={doctorAvatarUrl(name)} alt="" className="size-full object-cover" />
      </div>
      <span className="truncate text-[14px] font-bold text-[#1A1F1E]">{name}</span>
    </div>
  )
}

export function parseDiagnosisNotes(notes: string) {
  if (!notes.trim()) {
    return { clinicalNotes: "", confirmation: undefined, onsetDate: undefined, nyhaClass: undefined, laterality: undefined }
  }

  const segments = notes.split(/\n\n+/)
  const lastSegment = segments[segments.length - 1] ?? ""
  const hasMeta = /^(Confirmation:|Onset:|NYHA:|Laterality\/Region:)/.test(lastSegment.trim())

  if (!hasMeta) {
    return { clinicalNotes: notes.trim(), confirmation: undefined, onsetDate: undefined, nyhaClass: undefined, laterality: undefined }
  }

  const clinicalNotes = segments.slice(0, -1).join("\n\n").trim()
  const parsed = {
    clinicalNotes,
    confirmation: undefined as string | undefined,
    onsetDate: undefined as string | undefined,
    nyhaClass: undefined as string | undefined,
    laterality: undefined as string | undefined,
  }

  for (const part of lastSegment.split(" • ")) {
    const trimmed = part.trim()
    if (trimmed.startsWith("Confirmation:")) parsed.confirmation = trimmed.replace("Confirmation:", "").trim()
    else if (trimmed.startsWith("Onset:")) parsed.onsetDate = trimmed.replace("Onset:", "").trim()
    else if (trimmed.startsWith("NYHA:")) parsed.nyhaClass = trimmed.replace("NYHA:", "").trim()
    else if (trimmed.startsWith("Laterality/Region:")) parsed.laterality = trimmed.replace("Laterality/Region:", "").trim()
  }

  return parsed
}

export function DetailCell({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: ElementType
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between rounded-xl border border-[#E8E6E0]/60 bg-[#FAFAF8] p-3.5 shadow-sm transition-all hover:bg-white hover:border-[#1A5345]/20",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7870]">{label}</span>
        <div className="text-[13px] font-bold leading-snug text-[#1A1F1E] break-words sm:text-[14px]">
          {value}
        </div>
      </div>
      <Icon className="size-4 shrink-0 text-[#1A5345]" strokeWidth={2} aria-hidden />
    </div>
  )
}

export function SeverityBadge({ severity }: { severity: DiagnosisRecord["severity"] }) {
  const styles: Record<DiagnosisRecord["severity"], string> = {
    mild: "bg-emerald-600 text-white",
    moderate: "bg-amber-500 text-white",
    severe: "bg-orange-500 text-white",
    critical: "bg-red-600 text-white",
  }
  
  const labels: Record<DiagnosisRecord["severity"], string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    critical: "Critical",
  }

  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold text-white", styles[severity])}>
      {labels[severity]}
    </span>
  )
}

export function StatusBadge({ status }: { status: DiagnosisRecord["status"] }) {
  const styles: Record<DiagnosisRecord["status"], string> = {
    active: "bg-[#1A5345] text-white",
    chronic: "bg-red-500 text-white shadow-sm",
    resolved: "bg-slate-500 text-white",
  }

  const labels: Record<DiagnosisRecord["status"], string> = {
    active: "Active",
    chronic: "Chronic",
    resolved: "Resolved",
  }

  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold text-white", styles[status])}>
      {labels[status]}
    </span>
  )
}

export function TypeBadge({ type }: { type: DiagnosisRecord["type"] }) {
  const styles: Record<DiagnosisRecord["type"], string> = {
    primary: "bg-[#1A5345] text-white",
    secondary: "bg-blue-600 text-white",
    differential: "bg-amber-500 text-white",
  }

  const labels: Record<DiagnosisRecord["type"], string> = {
    primary: "Primary",
    secondary: "Secondary",
    differential: "Differential",
  }

  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-bold text-white", styles[type])}>
      {labels[type]}
    </span>
  )
}

export function emptyDiagnosisForm(): DiagnosisFormValues {
  return {
    icdCode: "",
    description: "",
    category: "other",
    chronicFlag: false,
    infectiousFlag: false,
    type: "secondary",
    confirmation: "confirmed",
    onsetDate: "",
    severity: "moderate",
    status: "active",
    nyhaClass: "",
    laterality: "unspecified",
    clinicalNotes: "",
  }
}

export function toDiagnosisForm(d: DiagnosisRecord): DiagnosisFormValues {
  return {
    icdCode: d.icdCode,
    description: d.description,
    category: d.category,
    chronicFlag: d.chronicFlag,
    infectiousFlag: d.infectiousFlag,
    type: d.type,
    confirmation: "confirmed",
    onsetDate: "",
    severity: d.severity,
    status: d.status,
    nyhaClass: "",
    laterality: "unspecified",
    clinicalNotes: d.notes,
  }
}

export function buildDiagnosisNotes(data: DiagnosisFormValues) {
  const extra: string[] = []
  if (data.confirmation) extra.push(`Confirmation: ${data.confirmation}`)
  if (data.onsetDate) extra.push(`Onset: ${data.onsetDate}`)
  if (data.nyhaClass) extra.push(`NYHA: ${data.nyhaClass}`)
  if (data.laterality && data.laterality !== "unspecified") extra.push(`Laterality/Region: ${data.laterality}`)
  return [data.clinicalNotes.trim(), extra.length ? `\n\n${extra.join(" • ")}` : ""].join("").trim()
}

export type RelatedConsultationVisit = VisitRecord & { hasFullReport: boolean }

export function findRelatedConsultationVisits(icdCode: string, visits: VisitRecord[]): RelatedConsultationVisit[] {
  const normalizedCode = icdCode.trim().toUpperCase()
  if (!normalizedCode) return []

  return visits
    .filter((visit) => {
      const summary = visit.diagnosisSummary.toUpperCase()
      const notes = visit.notes.toUpperCase()
      return summary.includes(normalizedCode) || notes.includes(normalizedCode)
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((visit) => ({
      ...visit,
      hasFullReport: true,
    }))
}

export const visitTypeStyles: Record<VisitRecord["type"], string> = {
  "follow-up": "bg-[#EEF5F3] text-[#1A5345]",
  new: "bg-blue-50 text-blue-700",
  "walk-in": "bg-amber-50 text-amber-700",
  "post-procedure": "bg-violet-50 text-violet-700",
  urgent: "bg-red-50 text-red-700",
}

export const diagnosesScrollbarCss = `
  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.15); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.3); }
`
