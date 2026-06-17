"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  UsersIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatShortTime } from "../assistantQueue.liveBoard"
import { useElapsedTime } from "../shared/useElapsedTime"
import type { DoctorStatus } from "./doctors.types"
import {
  formatBreakDuration,
  getDoctorQueueState,
  isoToTimeValue,
  parseTimeValueToDate,
} from "./doctors.helpers"
import { DoctorStateChip } from "./DoctorStateChip"

export function DoctorAttendanceCard({
  doc,
  onCheckIn,
  onTogglePause,
  onSetTime,
}: {
  doc: DoctorStatus
  onCheckIn: (id: string) => void
  onTogglePause: (id: string) => void
  onSetTime: (id: string, time: string) => void
  onStartNow: (id: string) => void
}) {
  const state = getDoctorQueueState(doc)
  const isCheckedIn = state !== "idle"
  const elapsed = useElapsedTime((state === "active" || state === "paused") ? doc.queueStartAt : null)
  const [timeDraft, setTimeDraft] = useState(() => isoToTimeValue(doc.queueStartAt))

  useEffect(() => {
    setTimeDraft(isoToTimeValue(doc.queueStartAt))
  }, [doc.id, doc.queueStartAt])

  return (
    <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col h-full">
        {/* Header: Avatar, Info & Badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className={cn("relative size-12 shrink-0 rounded-full bg-[#F5F5F3] border border-[#E8E6E0] overflow-hidden",
              state === "idle" ? "opacity-60 grayscale" : ""
            )}>
              <Image 
                src={`https://i.pravatar.cc/150?u=${doc.avatarSeed || doc.name.replace(/\s+/g, "")}`} 
                alt={doc.name} 
                fill 
                className="object-cover" 
                sizes="48px" 
                unoptimized
              />
            </div>
            <div className="min-w-0 pt-1">
              <p className="truncate text-[15px] font-bold text-[#1A1F1E]">{doc.name}</p>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7870] mt-0.5">
                <span>{doc.department}</span>
                <span className="text-[#E8E6E0]">·</span>
                <span className="text-[#4F6D64]">Room {doc.room}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
            <DoctorStateChip state={state} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#E8E6E0]/60 mb-4" />

        {/* Status / Time */}
        <div className="flex items-center justify-between text-[12px] mb-5">
          <div className="flex items-center gap-2">
            {doc.queueStartAt ? (
              <>
                <ClockIcon className="size-4 text-[#1A5345]" />
                <span className="font-bold text-[#1A1F1E]">{formatShortTime(doc.queueStartAt)}</span>
                {elapsed && (
                  <span className="text-[#6B7870] font-medium">· {elapsed} elapsed</span>
                )}
              </>
            ) : isCheckedIn ? (
              <span className="text-[#6B7870] font-medium">Queue time not set</span>
            ) : (
              <span className="text-gray-400 font-medium">Not checked in</span>
            )}
            {state === "paused" && doc.pausedAt && (
              <span className="ml-auto font-medium text-orange-600 border-l border-orange-200 pl-2">Paused {formatBreakDuration(doc.pausedAt)}</span>
            )}
          </div>
          
          {doc.queueCount !== undefined && doc.queueCount > 0 && (
            <div className="flex items-center gap-1 font-bold text-[#1A1F1E]">
              <UsersIcon className="size-3.5 text-[#6B7870]" />
              {doc.queueCount} <span className="text-[#6B7870] font-normal text-[11px]">waiting</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <button
            type="button"
            onClick={() => onCheckIn(doc.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors border",
              isCheckedIn
                ? "bg-white border-[#E8E6E0] text-[#1A1F1E] hover:border-red-200 hover:text-red-600 hover:bg-red-50"
                : "bg-white border-[#E8E6E0] text-[#1A1F1E] hover:bg-[#F9F8F5] hover:border-[#1A5345]/30 hover:text-[#1A5345]"
            )}
          >
            {isCheckedIn ? <LogOutIcon className="size-3.5" /> : <LogInIcon className="size-3.5" />}
            {isCheckedIn ? "Check Out" : "Check In"}
          </button>

          {(state === "active" || state === "paused") && (
            <button
              type="button"
              onClick={() => onTogglePause(doc.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors border shadow-sm",
                state === "paused"
                  ? "bg-[#1A5345] text-white border-transparent hover:bg-[#0F3D32]"
                  : "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
              )}
            >
              {state === "paused" ? <PlayCircleIcon className="size-3.5" /> : <PauseCircleIcon className="size-3.5" />}
              {state === "paused" ? "Resume" : "Pause Queue"}
            </button>
          )}

          {isCheckedIn && (
            <div className="relative flex items-center flex-1">
              <ClockIcon className={cn(
                "absolute left-3 size-4 pointer-events-none z-10",
                state === "paused" ? "text-[#B0B7B3]" : "text-[#6B7870]"
              )} />
              <input
                type="text"
                inputMode="numeric"
                placeholder="00:00"
                maxLength={5}
                value={timeDraft}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9]/g, "")
                  if (val.length >= 2) {
                    val = val.slice(0, 2) + ":" + val.slice(2, 4)
                  }
                  setTimeDraft(val)
                  if (parseTimeValueToDate(val)) {
                    onSetTime(doc.id, val)
                  }
                }}
                onBlur={() => {
                  if (!timeDraft) {
                    onSetTime(doc.id, "")
                    return
                  }
                  if (parseTimeValueToDate(timeDraft)) {
                    onSetTime(doc.id, timeDraft)
                    return
                  }
                  setTimeDraft(isoToTimeValue(doc.queueStartAt))
                }}
                disabled={state === "paused"}
                className={cn(
                  "w-full h-9 rounded-lg border bg-white pl-9 pr-3 text-[13px] font-bold tracking-wide",
                  "focus:border-[#1A5345] focus:ring-1 focus:ring-[#1A5345]/20 focus:outline-none",
                  "transition-all placeholder:text-[#B0B7B3] shadow-sm",
                  state === "paused"
                    ? "border-[#E8E6E0] text-[#B0B7B3] bg-[#FAFAF8] cursor-not-allowed"
                    : "border-[#E8E6E0] text-[#1A1F1E] hover:border-[#1A5345]/30"
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

