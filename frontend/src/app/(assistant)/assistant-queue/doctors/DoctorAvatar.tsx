"use client"

import { ClockIcon, PauseCircleIcon, StethoscopeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DoctorQueueState } from "./doctors.types"


export function DoctorAvatar({ state }: { state: DoctorQueueState }) {
  const styles: Record<DoctorQueueState, { bg: string; icon: React.ElementType; iconCls: string }> = {
    idle:      { bg: "bg-[#F0F0EE]",  icon: StethoscopeIcon, iconCls: "text-[#B0B7B3]" },
    checkedIn: { bg: "bg-blue-50",    icon: StethoscopeIcon, iconCls: "text-blue-500" },
    scheduled: { bg: "bg-amber-50",   icon: ClockIcon,       iconCls: "text-amber-500" },
    active:    { bg: "bg-[#1A5345]",  icon: StethoscopeIcon, iconCls: "text-white" },
    paused:    { bg: "bg-orange-100", icon: PauseCircleIcon, iconCls: "text-orange-500" },
  }
  const { bg, icon: Icon, iconCls } = styles[state]
  return (
    <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", bg)}>
      <Icon className={cn("size-5", iconCls)} />
    </div>
  )
}
