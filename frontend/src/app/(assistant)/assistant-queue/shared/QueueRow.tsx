"use client"

import { cn } from "@/lib/utils"
import type { QueuePatient } from "../assistantQueue.types"
import { formatShortTime } from "../assistantQueue.liveBoard"
import Image from "next/image"

export function QueueRow({
  patient,
  position,
  waitingTurn,
  isSelected,
  onSelect,
}: {
  patient: QueuePatient
  position: number
  waitingTurn?: number | null
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200",
        isSelected
          ? "bg-white shadow-sm ring-1 ring-[#1A5345]/20"
          : "hover:bg-[#EAEBE8]/50"
      )}
    >
      <div className="relative shrink-0">
        <div className="relative size-10 overflow-hidden rounded-full border border-[#E8E6E0] bg-[#F5F5F3]">
          <Image
            src={patient.avatarUrl || `https://i.pravatar.cc/150?u=${patient.id}`}
            alt={patient.fullName}
            fill
            className="object-cover"
          />
        </div>
        {/* Queue number badge for first 3 waiting patients */}
        {patient.status === "waiting" && waitingTurn != null && waitingTurn <= 3 && (
          <div className="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-amber-500 text-[9px] font-bold text-white shadow-sm">
            {waitingTurn}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "truncate text-[13px] font-semibold transition-colors",
              isSelected ? "text-[#1A5345]" : "text-[#1A1F1E] group-hover:text-[#1A5345]"
            )}>
              {patient.fullName}
            </span>
            {patient.visitType === "new" && (
              <span className="shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide bg-violet-50 border-violet-200/60 text-violet-700">
                New
              </span>
            )}
          </div>
          {patient.scheduledTime && (
            <span className="shrink-0 ml-2 text-[10px] text-muted-foreground">
              {formatShortTime(patient.scheduledTime)}
            </span>
          )}
        </div>
        
        <div className="mt-0.5 flex items-center justify-between text-[11px]">
          <span className="truncate font-medium text-muted-foreground">
            {patient.condition || patient.visitType}
          </span>
          <span className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset",
            patient.status === "in-consultation" ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
            : patient.status === "waiting" ? "bg-amber-50 text-amber-700 ring-amber-600/20"
            : patient.status === "arrived" ? "bg-blue-50 text-blue-700 ring-blue-600/20"
            : patient.status === "no-show" ? "bg-red-50 text-red-600 ring-red-500/20"
            : patient.status === "completed" ? "bg-[#E8F0EE] text-[#1A5345] ring-[#1A5345]/20"
            : patient.status === "cancelled" ? "bg-slate-50 text-slate-600 ring-slate-500/20"
            : "bg-gray-50 text-gray-600 ring-gray-500/20"
          )}>
            {patient.status.replace('-', ' ')}
          </span>
        </div>
      </div>
    </button>
  )
}
