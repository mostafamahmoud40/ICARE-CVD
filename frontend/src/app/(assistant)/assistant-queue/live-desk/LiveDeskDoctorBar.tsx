"use client"

import { StethoscopeIcon } from "lucide-react"
import type { DoctorLiveSnapshot } from "../assistantQueue.liveBoard"
import { useElapsedTime } from "../shared/useElapsedTime"


export function LiveDeskDoctorBar({ snapshot }: { snapshot: DoctorLiveSnapshot }) {
  const allActive = [
    ...snapshot.inConsultation,
    ...snapshot.waitingOrdered,
    ...snapshot.arrivedOrdered,
  ]
  const queueStartISO =
    allActive
      .map((p) => p.waitingSince ?? p.arrivedAt)
      .filter(Boolean)
      .sort()
      .at(0) ?? null

  const elapsed = useElapsedTime(queueStartISO)

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#E8E6E0]/80 bg-white px-4 py-3 sm:px-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] z-10">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center">
          <StethoscopeIcon className="size-5 text-[#1A5345] stroke-[2.5]" />
        </div>
        <div>
          <p className="font-serif text-[14px] font-bold tracking-tight text-[#102F27] sm:text-[16px]">{snapshot.doctorName}</p>
          <p className="text-[11px] font-medium text-muted-foreground">{snapshot.department}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {snapshot.roomHints.length > 0 && (
          <span className="rounded-lg bg-[#E8F0EE] px-2.5 py-1 text-[11px] font-bold text-[#1A5345]">
            Room {snapshot.roomHints.join(", ")}
          </span>
        )}
        <span className="rounded-lg bg-[#F9F8F5] px-2.5 py-1 text-[11px] font-bold text-muted-foreground border border-[#E8E6E0]">
          {snapshot.inConsultation.length + snapshot.waitingOrdered.length + snapshot.arrivedOrdered.length} active
        </span>
        {elapsed && (
          <span className="inline-flex items-center rounded-lg bg-[#1A5345]/5 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#1A5345]">
            {elapsed}
          </span>
        )}
      </div>
    </div>
  )
}
