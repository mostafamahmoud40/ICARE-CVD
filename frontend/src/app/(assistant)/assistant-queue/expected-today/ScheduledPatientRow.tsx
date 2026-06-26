"use client"

import { AlertTriangleIcon, ArrowRightIcon, LogInIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QueuePatient } from "../assistantQueue.types"
import { PRIORITY_CONFIG, VISIT_TYPE_CONFIG } from "../assistantQueue.config"
import { formatShortTime } from "../assistantQueue.liveBoard"


export function ScheduledPatientRow({
  patient,
  onSelect,
  onMarkArrived,
}: {
  patient: QueuePatient
  onSelect: (id: string) => void
  onMarkArrived?: (id: string) => void
}) {
  const visitCfg = VISIT_TYPE_CONFIG[patient.visitType] ?? { label: patient.visitType, style: "bg-gray-50 text-gray-600" }

  // Check if late (scheduled time passed)
  const scheduledDate = new Date(patient.scheduledTime)
  const now = new Date()
  const isLate = scheduledDate < now
  const minutesLate = isLate ? Math.floor((now.getTime() - scheduledDate.getTime()) / 60000) : 0

  return (
    <div className="group flex w-full items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar with status ring */}
      <button
        onClick={() => onSelect(patient.queueEntryId)}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
      >
        <div className={cn("absolute inset-0 rounded-full ring-2", isLate ? "ring-red-300" : "ring-[#E8E6E0]/60")} />
        <img
          src={`https://i.pravatar.cc/150?u=${patient.id}`}
          alt={patient.fullName}
          className="size-full object-cover rounded-full"
        />
        {isLate && (
          <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-white border-2 border-white">
            <AlertTriangleIcon className="size-2.5" />
          </div>
        )}
      </button>

      {/* Main Info */}
      <button
        onClick={() => onSelect(patient.queueEntryId)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-[#102F27] truncate">{patient.fullName}</span>
          <span className="text-[12px] text-muted-foreground">{patient.age}y</span>
          {patient.priority !== "normal" && (
            <span className={cn("rounded-lg px-2 py-0.5 text-[10px] font-bold text-white shadow-sm bg-[#CC5533]")}>
              {PRIORITY_CONFIG[patient.priority].label}
            </span>
          )}
          {isLate && (
            <span className="rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {minutesLate}m late
            </span>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
          <span className={cn("rounded-lg px-2 py-0.5 font-bold text-[10px] text-white shadow-sm", 
            patient.visitType === 'walk-in' ? "bg-[#CC5533]" : "bg-[#1A5345]")}>
            {visitCfg.label}
          </span>
          {patient.condition && <span className="text-muted-foreground truncate max-w-[150px]">{patient.condition}</span>}
          {patient.phoneNumber && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="text-[10px]">📞</span>
              {patient.phoneNumber}
            </span>
          )}
        </div>
      </button>

      {/* Time & Actions */}
      <div className="flex flex-col items-end gap-2">
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0",
          isLate 
            ? "text-[#CC5533] bg-[#CC5533]/5" 
            : "text-[#1A5345] bg-[#1A5345]/5"
        )}>
          {formatShortTime(patient.scheduledTime)}
        </span>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMarkArrived && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkArrived(patient.queueEntryId)
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1A5345] text-white text-[10px] font-medium hover:bg-[#0F3D32] transition-colors"
            >
              <LogInIcon className="size-3" />
              Arrived
            </button>
          )}
          <button
            onClick={() => onSelect(patient.queueEntryId)}
            className="p-1.5 rounded-lg text-[#6B7870] hover:bg-transparent hover:text-[#1A5345] transition-colors"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
