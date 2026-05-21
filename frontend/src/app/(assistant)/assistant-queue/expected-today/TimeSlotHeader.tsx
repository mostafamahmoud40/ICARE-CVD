"use client"

import { AlertTriangleIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"


export function TimeSlotHeader({ time, count, isLate }: { time: string; count: number; isLate?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold",
        isLate ? "bg-red-100 text-red-700" : "bg-[#E8F0EE] text-[#1A5345]"
      )}>
        <ClockIcon className="size-3.5" />
        {time}
      </div>
      <span className="text-[11px] text-muted-foreground">{count} patients</span>
      {isLate && (
        <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
          <AlertTriangleIcon className="size-3" />
          Late
        </span>
      )}
    </div>
  )
}
