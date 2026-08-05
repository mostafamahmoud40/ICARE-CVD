"use client"

import { LogOutIcon, PauseCircleIcon, PlayCircleIcon, UsersIcon } from "lucide-react"
import type { DoctorStatus } from "./doctors.types"


export function DoctorStatsSummary({ doctors }: { doctors: DoctorStatus[] }) {
  const active = doctors.filter(d => d.checkedInAt && !d.isPaused).length
  const paused = doctors.filter(d => d.isPaused).length
  const away = doctors.filter(d => !d.checkedInAt).length
  const totalPatients = doctors.reduce((sum, d) => sum + (d.queueCount || 0), 0)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
      <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-center text-emerald-600">
          <PlayCircleIcon className="size-5" />
        </div>
        <div>
          <div className="text-[18px] font-bold text-[#1A1F1E]">{active}</div>
          <div className="text-[11px] font-medium text-[#6B7870]">Active</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-center text-[#d46a4c]">
          <PauseCircleIcon className="size-5" />
        </div>
        <div>
          <div className="text-[18px] font-bold text-[#1A1F1E]">{paused}</div>
          <div className="text-[11px] font-medium text-[#6B7870]">Paused</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-center text-[#6B7870]">
          <LogOutIcon className="size-5" />
        </div>
        <div>
          <div className="text-[18px] font-bold text-[#1A1F1E]">{away}</div>
          <div className="text-[11px] font-medium text-[#6B7870]">Away</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-center text-[#1A5345]">
          <UsersIcon className="size-5" />
        </div>
        <div>
          <div className="text-[18px] font-bold text-[#1A1F1E]">{totalPatients}</div>
          <div className="text-[11px] font-medium text-[#6B7870]">Patients</div>
        </div>
      </div>
    </div>
  )
}

