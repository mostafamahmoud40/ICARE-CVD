"use client"

import { cn } from "@/lib/utils"
import type { DoctorQueueState } from "./doctors.types"

const STATE_CHIP: Record<DoctorQueueState, { label: string; dot: string; text: string; pulse?: boolean }> = {
  idle:      { label: "Not arrived",     dot: "bg-gray-400",   text: "text-gray-600" },
  checkedIn: { label: "Arrived",         dot: "bg-blue-500",   text: "text-blue-700" },
  scheduled: { label: "Queue scheduled", dot: "bg-amber-500",  text: "text-amber-700" },
  active:    { label: "Queue active",    dot: "bg-emerald-500",text: "text-emerald-700", pulse: true },
  paused:    { label: "On break",        dot: "bg-orange-500", text: "text-orange-700" },
}

export function DoctorStateChip({ state }: { state: DoctorQueueState }) {
  const cfg = STATE_CHIP[state]
  return (
    <div className={`flex items-center gap-1.5 ${cfg.text}`}>
      <span className={cn(`size-1.5 rounded-full ${cfg.dot}`, cfg.pulse && "animate-pulse")} />
      <span className="text-[11px] font-medium leading-none">{cfg.label}</span>
    </div>
  )
}

