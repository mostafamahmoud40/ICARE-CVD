"use client"

import { useState } from "react"
import { ClockIcon, HistoryIcon, LogInIcon, LogOutIcon, PauseCircleIcon, PlayCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatShortTime } from "../assistantQueue.liveBoard"
import type { ActivityLog } from "./doctors.types"

export function ActivityLogPanel({ logs }: { logs: ActivityLog[] }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-[12px] font-semibold text-[#1A5345] hover:text-[#0F3D32] transition-colors"
      >
        <HistoryIcon className="size-4" />
        View recent activity
        <span className="text-[10px] text-[#6B7870]">({logs.length})</span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white overflow-hidden shadow-sm max-w-sm w-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E0]/60 bg-[#FAFAF8]">
        <div className="flex items-center gap-2">
          <HistoryIcon className="size-4 text-[#6B7870]" />
          <span className="text-[13px] font-bold text-[#1A1F1E]">Recent Activity</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-[11px] font-semibold text-[#6B7870] hover:text-[#1A5345]">
          Hide
        </button>
      </div>
      <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-[#6B7870]">No recent activity</div>
        ) : (
          <div className="divide-y divide-[#E8E6E0]/40">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
                <div className={cn(
                  "flex size-5 items-center justify-center rounded-full shrink-0",
                  log.action === "check-in" ? "text-emerald-600" :
                  log.action === "check-out" ? "text-gray-500" :
                  log.action === "pause" ? "text-orange-500" :
                  log.action === "resume" ? "text-blue-500" :
                  "text-[#1A5345]"
                )}>
                  {log.action === "check-in" && <LogInIcon className="size-4" />}
                  {log.action === "check-out" && <LogOutIcon className="size-4" />}
                  {log.action === "pause" && <PauseCircleIcon className="size-4" />}
                  {log.action === "resume" && <PlayCircleIcon className="size-4" />}
                  {log.action === "set-time" && <ClockIcon className="size-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-[#1A1F1E] capitalize">{log.action.replace("-", " ")}</span>
                  {log.details && <span className="text-[#6B7870]"> · {log.details}</span>}
                </div>
                <span className="text-[10px] text-[#6B7870] shrink-0 font-medium">{formatShortTime(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

