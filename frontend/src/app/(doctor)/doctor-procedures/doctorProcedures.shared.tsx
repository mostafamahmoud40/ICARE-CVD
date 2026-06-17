"use client"

import { cn } from "@/lib/utils"
import type { ProcedureOrder } from "@/app/(assistant)/assistant-procedures/assistantProcedures.types"

export const doctorProceduresListSearchInputClassName =
  "h-10 w-full rounded-2xl border border-[#E8E6E0]/80 bg-[#F9F8F5] pl-10 pr-4 text-[13px] font-medium text-[#1A1F1E] shadow-none transition-[border-color,background-color,box-shadow] placeholder:font-medium placeholder:text-muted-foreground/55 focus-visible:border-[#1A5345]/50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1A5345]/12 sm:h-11 sm:pl-11 sm:text-[14px]"

export function doctorProceduresScrollbarCss() {
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

export function formatScheduledAt(value: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

export function getProcedureReadiness(order: ProcedureOrder) {
  const total = order.requirements.length
  const done = order.requirements.filter((r) => r.isDone).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return { done, total, pct, pending: total - done }
}

export function ReadinessPill({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, pct))
  const color = safe >= 100 ? "bg-emerald-500" : safe >= 70 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#E8E6E0]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${safe}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{safe}%</span>
    </div>
  )
}
