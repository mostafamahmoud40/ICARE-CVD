"use client"

import { PlayCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { isoToTimeValue } from "./doctors.helpers"


export function QueueTimeRow({
  doctorId,
  queueStartAt,
  isDisabled,
  onSetTime,
  onStartNow,
}: {
  doctorId: string
  queueStartAt: string | null
  isDisabled: boolean
  onSetTime: (id: string, time: string) => void
  onStartNow: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[#E8E6E0] pt-3">
      <span className="text-[9px] font-medium text-[#6B7870]">Queue starts at</span>
      <input
        type="time"
        value={isoToTimeValue(queueStartAt)}
        onChange={(e) => onSetTime(doctorId, e.target.value)}
        disabled={isDisabled}
        className={cn(
          "h-7 rounded-lg border border-[#E5EEEA] px-2 text-[11px] focus:border-[#1A5345] focus:outline-none",
          isDisabled ? "bg-[#F5F5F3] text-[#B0B7B3]" : "bg-white text-[#102F27]",
        )}
      />
      <button
        type="button"
        onClick={() => onStartNow(doctorId)}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-medium transition-all",
          isDisabled
            ? "cursor-not-allowed text-[#B0B7B3]"
            : "bg-[#1A5345]/10 text-[#1A5345] hover:bg-[#1A5345]/20",
        )}
      >
        <PlayCircleIcon className="size-3" />
        Start now
      </button>
    </div>
  )
}
