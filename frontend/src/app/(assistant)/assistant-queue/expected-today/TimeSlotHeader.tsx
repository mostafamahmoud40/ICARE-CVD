"use client"

import { AlertTriangleIcon } from "lucide-react"
import { cn } from "@/lib/utils"


export function TimeSlotHeader({ time, count, isLate }: { time: string; count: number; isLate?: boolean }) {
  const isMorning = time.toLowerCase().includes("morning") || time.toLowerCase().includes("am")
  
  return (
    <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
      <div className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold tracking-tight",
        isLate 
          ? "text-[#CC5533] bg-[#CC5533]/5 border border-[#CC5533]/10" 
          : isMorning 
            ? "text-[#1A5345] bg-[#1A5345]/5 border border-[#1A5345]/10" 
            : "text-[#926020] bg-[#926020]/5 border border-[#926020]/10"
      )}>
        {time}
      </div>
      <span className="text-[11px] font-bold text-[#6B7870] tracking-tight">{count} patients</span>
      {isLate && (
        <span className="flex items-center gap-1 text-[10px] text-[#CC5533] font-bold tracking-tight">
          <AlertTriangleIcon className="size-3" strokeWidth={2.5} />
          Needs Triage
        </span>
      )}
    </div>
  )
}
