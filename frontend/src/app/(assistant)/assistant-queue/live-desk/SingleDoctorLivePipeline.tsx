"use client"

import {
  ArrowDownCircleIcon,
  CalendarDaysIcon,
  LogInIcon,
  PlayCircleIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react"
import type { DoctorLiveSnapshot } from "../assistantQueue.liveBoard"
import { formatShortTime } from "../assistantQueue.liveBoard"
import { PipelineRow } from "./PipelineRow"
import { PipelineSectionHeader } from "./PipelineSectionHeader"

export function SingleDoctorLivePipeline({
  snapshot,
  waitingTurnByQueueId,
  liveBoardLoading,
  onSelectPatient,
}: {
  snapshot: DoctorLiveSnapshot | null
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onSelectPatient: (id: string) => void
}) {
  if (liveBoardLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="size-6 animate-spin rounded-full border-2 border-[#1A5345] border-t-transparent" />
          <p className="text-[10px] text-muted-foreground">Loading live data…</p>
        </div>
      </div>
    )
  }

  const displaySnapshot = snapshot

  if (!displaySnapshot) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16 text-center bg-white rounded-2xl border-2 border-dashed border-[#E5EEEA] m-6">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#F5F5F3]">
          <StethoscopeIcon className="size-7 text-[#9CA3AF] stroke-[1.5]" />
        </div>
        <h3 className="text-[14px] font-bold text-[#1A1F1E]">No active visits yet</h3>
        <p className="mt-1 text-[12px] font-medium text-muted-foreground max-w-[280px]">
          The queue will update automatically once patients check in for this doctor.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F9F8F5] p-4 sm:p-6 lg:p-6 custom-scrollbar">
      <div className="space-y-6">

        {/* ── TOP ROW: FOCUS ZONE (With Doctor & Next Up) ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* 1. WITH DOCTOR NOW */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-4 sm:p-5">
              <PipelineSectionHeader
                icon={PlayCircleIcon}
                iconClass="text-[#1A5345]"
                title="With doctor now"
                count={displaySnapshot.inConsultation.length}
              />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E8E6E0]/40">
              {displaySnapshot.inConsultation.length > 0 ? (
                <>
                  {displaySnapshot.inConsultation.map((p: any) => (
                    <PipelineRow
                      key={p.queueEntryId}
                      patient={p}
                      badge={<PlayCircleIcon className="size-4 text-[#1A5345]" />}
                      subline={p.startedAt ? `Started ${formatShortTime(p.startedAt)} · ~${p.estimatedDurationMin} min` : undefined}
                      liveTimeISO={p.startedAt}
                      accent
                      onSelect={onSelectPatient}
                    />
                  ))}
                </>
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-[#FBFDFC]/50">
                  <p className="text-[14px] font-bold text-[#1A1F1E]">Room is free</p>
                  <p className="mt-1 text-[12px] font-medium text-muted-foreground">Ready for the next patient.</p>
                </div>
              )}
            </div>
          </section>

          {/* 2. NEXT UP */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-4 sm:p-5">
              <PipelineSectionHeader
                icon={ArrowDownCircleIcon}
                iconClass="text-[#1A5345]"
                title="Next up"
              />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E8E6E0]/40">
              {displaySnapshot.nextPatient ? (
                <PipelineRow
                  patient={displaySnapshot.nextPatient}
                  badge={<ArrowDownCircleIcon className="size-4 text-[#1A5345]" />}
                  subline={
                    displaySnapshot.nextPatient.status === "waiting"
                      ? `Turn #${waitingTurnByQueueId.get(displaySnapshot.nextPatient.queueEntryId) ?? "—"} · waiting since ${displaySnapshot.nextPatient.waitingSince ? formatShortTime(displaySnapshot.nextPatient.waitingSince) : "—"}`
                      : displaySnapshot.nextPatient.arrivedAt
                        ? `Arrived ${formatShortTime(displaySnapshot.nextPatient.arrivedAt)} · needs to be moved to waiting`
                        : undefined
                  }
                  liveTimeISO={displaySnapshot.nextPatient.status === "waiting" ? displaySnapshot.nextPatient.waitingSince : displaySnapshot.nextPatient.arrivedAt}
                  onSelect={onSelectPatient}
                  accent
                />
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-[#FBFDFC]/50">
                  <p className="text-[14px] font-bold text-[#1A1F1E]">No patient assigned next</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── BOTTOM ROW: QUEUE ZONE ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* 3. WAITING QUEUE */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-4 sm:p-5">
              <PipelineSectionHeader
                icon={UsersIcon}
                iconClass="text-amber-600"
                title="Waiting queue"
                count={displaySnapshot.waitingOrdered.filter((p: any) => p.queueEntryId !== displaySnapshot.nextPatient?.queueEntryId).length}
              />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E8E6E0]/40">
              {displaySnapshot.waitingOrdered.filter((p: any) => p.queueEntryId !== displaySnapshot.nextPatient?.queueEntryId).length > 0 ? (
                <>
                  {displaySnapshot.waitingOrdered.map((p: any) => {
                    const turn = waitingTurnByQueueId.get(p.queueEntryId) ?? 0
                    if (displaySnapshot.nextPatient?.queueEntryId === p.queueEntryId) return null
                    return (
                      <PipelineRow
                        key={p.queueEntryId}
                        patient={p}
                        badge={
                          <span className="text-[11px] font-extrabold leading-none text-amber-800">
                            #{turn}
                          </span>
                        }
                        subline={p.waitingSince ? `Waiting since ${formatShortTime(p.waitingSince)}` : undefined}
                        liveTimeISO={p.waitingSince}
                        onSelect={onSelectPatient}
                      />
                    )
                  })}
                </>
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-[#FBFDFC]/50">
                  <p className="text-[14px] font-bold text-[#1A1F1E]">No patients waiting</p>
                </div>
              )}
            </div>
          </section>

          {/* 4. JUST ARRIVED */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-4 sm:p-5">
              <PipelineSectionHeader
                icon={LogInIcon}
                iconClass="text-blue-600"
                title="Just arrived"
                count={displaySnapshot.arrivedOrdered.filter((p: any) => p.queueEntryId !== displaySnapshot.nextPatient?.queueEntryId).length}
              />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E8E6E0]/40">
              {displaySnapshot.arrivedOrdered.filter((p: any) => p.queueEntryId !== displaySnapshot.nextPatient?.queueEntryId).length > 0 ? (
                <>
                  {displaySnapshot.arrivedOrdered.map((p: any) => {
                    if (displaySnapshot.nextPatient?.queueEntryId === p.queueEntryId) return null
                    return (
                      <PipelineRow
                        key={p.queueEntryId}
                        patient={p}
                        badge={<LogInIcon className="size-4 text-blue-600" />}
                        subline={p.arrivedAt ? `Checked in ${formatShortTime(p.arrivedAt)}` : undefined}
                        liveTimeISO={p.arrivedAt}
                        onSelect={onSelectPatient}
                      />
                    )
                  })}
                </>
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-[#FBFDFC]/50">
                  <p className="text-[14px] font-bold text-[#1A1F1E]">No new arrivals</p>
                </div>
              )}
            </div>
          </section>

          {/* 5. UPCOMING TODAY */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-[#E8E6E0]/80 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#E8E6E0]/60 bg-[#F9F8F5] p-4 sm:p-5">
              <PipelineSectionHeader
                icon={CalendarDaysIcon}
                iconClass="text-[#6B7870]"
                title="Upcoming today"
                count={displaySnapshot.scheduledOrdered.length}
              />
            </div>
            <div className="flex-1 flex flex-col divide-y divide-[#E8E6E0]/40">
              {displaySnapshot.scheduledOrdered.length > 0 ? (
                <>
                  {displaySnapshot.scheduledOrdered.map((p: any) => (
                    <PipelineRow
                      key={p.queueEntryId}
                      patient={p}
                      badge={
                        <span className="text-center text-[9px] font-bold leading-tight text-[#4F6D64]">
                          {formatShortTime(p.scheduledTime)}
                        </span>
                      }
                      subline={p.condition || undefined}
                      onSelect={onSelectPatient}
                    />
                  ))}
                </>
              ) : (
                <div className="flex h-28 flex-col items-center justify-center bg-[#FBFDFC]/50">
                  <p className="text-[14px] font-bold text-[#1A1F1E]">No more scheduled</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

