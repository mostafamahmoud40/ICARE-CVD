"use client"

import { LogInIcon, PauseCircleIcon, PlayCircleIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DoctorQueueState } from "./doctors.types"


export function DoctorActions({
  doctorId,
  state,
  onCheckIn,
  onTogglePause,
}: {
  doctorId: string
  state: DoctorQueueState
  onCheckIn: (id: string) => void
  onTogglePause: (id: string) => void
}) {
  const showPause = state === "active" || state === "paused"
  const isCheckedIn = state !== "idle"
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {showPause && (
        <button
          type="button"
          onClick={() => onTogglePause(doctorId)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all",
            state === "paused"
              ? "bg-[#1A5345] text-white hover:bg-[#0F3D32]"
              : "bg-orange-50 text-orange-600 hover:bg-orange-100",
          )}
        >
          {state === "paused"
            ? <><PlayCircleIcon className="size-3.5" /><span className="hidden sm:inline">Resume</span></>
            : <><PauseCircleIcon className="size-3.5" /><span className="hidden sm:inline">Pause</span></>}
        </button>
      )}
      <button
        type="button"
        onClick={() => onCheckIn(doctorId)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all",
          isCheckedIn
            ? "bg-[#F5F5F3] text-[#6B7870] hover:bg-red-50 hover:text-red-600"
            : "bg-[#1A5345] text-white hover:bg-[#0F3D32]",
        )}
      >
        {isCheckedIn
          ? <><XIcon className="size-3.5" /><span className="hidden sm:inline">Undo</span></>
          : <><LogInIcon className="size-3.5" /><span className="hidden sm:inline">Check in</span></>}
      </button>
    </div>
  )
}
