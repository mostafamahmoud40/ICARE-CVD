"use client"

import type { DoctorLiveSnapshot } from "../assistantQueue.liveBoard"
import { LiveDeskDoctorBar } from "./LiveDeskDoctorBar"
import { SingleDoctorLivePipeline } from "./SingleDoctorLivePipeline"


export function LiveDeskPanel({
  snapshots,
  waitingTurnByQueueId,
  liveBoardLoading,
  onSelectPatient,
}: {
  snapshots: DoctorLiveSnapshot[]
  waitingTurnByQueueId: Map<string, number>
  liveBoardLoading: boolean
  onSelectPatient: (id: string) => void
}) {
  const snapshot = snapshots[0] ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Doctor identity bar */}
      {snapshot && (
        <LiveDeskDoctorBar snapshot={snapshot} />
      )}
      <SingleDoctorLivePipeline
        snapshot={snapshot}
        waitingTurnByQueueId={waitingTurnByQueueId}
        liveBoardLoading={liveBoardLoading}
        onSelectPatient={onSelectPatient}
      />
    </div>
  )
}
