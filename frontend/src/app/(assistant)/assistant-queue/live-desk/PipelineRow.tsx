"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AlertTriangleIcon, ShieldAlertIcon } from "lucide-react"
import type { QueuePatient } from "../assistantQueue.types"
import { PRIORITY_CONFIG, VISIT_TYPE_CONFIG } from "../assistantQueue.config"
import { StatusBadge } from "../shared/StatusBadge"
import { useElapsedTime } from "../shared/useElapsedTime"
import Image from "next/image"

export function PipelineRow({
  patient,
  badge,
  subline,
  accent = false,
  liveTimeISO,
  onSelect,
}: {
  patient: QueuePatient
  badge: ReactNode
  subline?: ReactNode
  accent?: boolean
  liveTimeISO?: string | null
  onSelect: (id: string) => void
}) {
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }
  const elapsed = useElapsedTime(liveTimeISO ?? null)

  return (
    <button
      type="button"
      onClick={() => onSelect(patient.queueEntryId)}
      className={cn(
        "group relative flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F9F8F5]/50",
        accent ? "bg-[#F9F8F5]/40" : "bg-white"
      )}
    >
      <div className="relative shrink-0 pt-0.5">
        <div className="relative size-12 overflow-hidden rounded-full border border-[#E8E6E0]/60 bg-[#F4F3EF] shadow-sm">
          <Image
            src={patient.avatarUrl || `https://i.pravatar.cc/150?u=${patient.id}`}
            alt={patient.fullName}
            fill
            className="object-cover"
          />
        </div>
        {badge && (
          <div className="absolute -bottom-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-black/5">
            {badge}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[15px] font-bold text-[#1A1F1E] group-hover:text-[#1A5345] transition-colors">
            {patient.fullName}
          </span>
          <span className="shrink-0 rounded-md bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7870] ring-1 ring-inset ring-[#E8E6E0]/80">
            {patient.age}y
          </span>
          {patient.priority !== "normal" && (
            <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase ring-1 ring-inset", PRIORITY_CONFIG[patient.priority].style.replace('bg-', 'bg-').replace('text-', 'text-'))}>
              {PRIORITY_CONFIG[patient.priority].label}
            </span>
          )}
        </div>
        
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
          <span className={cn("rounded-md px-1.5 py-0.5 font-medium ring-1 ring-inset ring-black/5", visitCfg.style)}>
            {visitCfg.label}
          </span>
          {subline && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-medium text-muted-foreground">{subline}</span>
            </>
          )}
        </div>
        
        {(patient.hasAllergies || patient.vitalAlerts > 0) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {patient.hasAllergies && (
              <span className="flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-inset ring-red-500/10">
                <ShieldAlertIcon className="size-3" /> Allergies
              </span>
            )}
            {patient.vitalAlerts > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-inset ring-amber-500/10">
                <AlertTriangleIcon className="size-3" /> {patient.vitalAlerts} Alert{patient.vitalAlerts > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex shrink-0 flex-col items-end gap-2.5">
        <StatusBadge status={patient.status} />
        {elapsed && (
          <span className="shrink-0 rounded-md bg-[#1A5345]/5 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#1A5345]">
            {elapsed}
          </span>
        )}
      </div>
    </button>
  )
}

