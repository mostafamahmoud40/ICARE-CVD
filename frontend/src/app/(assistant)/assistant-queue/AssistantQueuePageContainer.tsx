"use client"

import { useMemo, useEffect } from "react"
import { AssistantQueue } from "./AssistantQueue"
import type { QueueNavMode } from "./queueNavMode"
import { useAssistantQueue } from "./useAssistantQueue"
import { MOCK_QUEUE_PATIENTS, MOCK_QUEUE_STATS } from "./assistantQueue.mock"
import {
  buildDoctorLiveSnapshots,
  buildWaitingTurnMap,
} from "./assistantQueue.liveBoard"
import { filterHistoryPatients } from "./past-visits/pastVisits.helpers"

/** When the active floor has fewer than this many patients, prefer rich demo data (dev only). */
const MOCK_FALLBACK_MIN_LIVE_FLOOR = 3

type AssistantQueuePageContainerProps = {
  queueNavMode: QueueNavMode
}

export function AssistantQueuePageContainer({ queueNavMode }: AssistantQueuePageContainerProps) {
  const api = useAssistantQueue()

  useEffect(() => {
    api.clearSelection()
    if (queueNavMode === "operations") api.setFilter("active")
    else if (queueNavMode === "schedule") api.setFilter("scheduled")
    else if (queueNavMode === "doctors") api.setFilter("scheduled")
    else if (queueNavMode !== "history") api.setFilter("completed")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueNavMode])

  const liveBoardFloorTotal = useMemo(
    () =>
      api.doctorLiveSnapshots.reduce(
        (acc, s) =>
          acc +
          s.inConsultation.length +
          s.waitingOrdered.length +
          s.arrivedOrdered.length +
          s.scheduledOrdered.length,
        0,
      ),
    [api.doctorLiveSnapshots],
  )

  const isDev = process.env.NODE_ENV === "development"

  /* ── Mock fallback: empty API, or sparse active floor in dev (richer Live desk demo) ── */
  const useMock =
    !api.isLoading &&
    !api.liveBoardLoading &&
    !api.isError &&
    (api.allPatients.length === 0 ||
      (isDev &&
        api.filter === "active" &&
        liveBoardFloorTotal < MOCK_FALLBACK_MIN_LIVE_FLOOR))

  const pastVisitsPatients = useMemo(() => {
    if (useMock) return filterHistoryPatients(MOCK_QUEUE_PATIENTS)
    return filterHistoryPatients(api.historyPatients)
  }, [useMock, api.historyPatients])

  const selectedPatient = useMemo(() => {
    if (!api.selectedPatientId) return null
    if (useMock) {
      const pool =
        queueNavMode === "history" ? pastVisitsPatients : MOCK_QUEUE_PATIENTS
      return pool.find((p) => p.queueEntryId === api.selectedPatientId) ?? null
    }
    if (queueNavMode === "history") {
      return (
        pastVisitsPatients.find((p) => p.queueEntryId === api.selectedPatientId) ??
        api.selectedPatient
      )
    }
    return api.selectedPatient
  }, [api.selectedPatient, api.selectedPatientId, useMock, queueNavMode, pastVisitsPatients])

  const mockSnapshots = useMemo(() => buildDoctorLiveSnapshots(MOCK_QUEUE_PATIENTS), [])
  const mockTurnMap   = useMemo(() => buildWaitingTurnMap(mockSnapshots), [mockSnapshots])

  const mockTabCounts = useMemo(() => {
    const s = MOCK_QUEUE_STATS
    return {
      active: s.scheduled + s.arrived + s.inWaiting + s.inConsultation,
      scheduled: s.scheduled,
      completed: s.completed,
      "no-show": s.noShow,
    }
  }, [])

  return (
    <AssistantQueue
      patients={useMock ? MOCK_QUEUE_PATIENTS : api.patients}
      stats={useMock ? MOCK_QUEUE_STATS : api.stats}
      filter={api.filter}
      setFilter={api.setFilter}
      searchTerm={api.searchTerm}
      setSearchTerm={api.setSearchTerm}
      tabCounts={useMock ? mockTabCounts : api.tabCounts}
      onMarkArrived={api.markArrived}
      onMoveToWaiting={api.moveToWaiting}
      onNoShow={api.markNoShow}
      selectedPatient={selectedPatient}
      selectPatient={api.selectPatient}
      clearSelection={api.clearSelection}
      inClinicPatients={api.inClinicPatients}
      doctorLiveSnapshots={useMock ? mockSnapshots : api.doctorLiveSnapshots}
      waitingTurnByQueueId={useMock ? mockTurnMap : api.waitingTurnByQueueId}
      liveBoardLoading={api.liveBoardLoading}
      isLoading={api.isLoading}
      isError={api.isError}
      queueNavMode={queueNavMode}
      pastVisitsPatients={pastVisitsPatients}
      pastVisitsLoading={useMock ? false : api.historyLoading}
    />
  )
}
