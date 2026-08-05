"use client"

import { useEffect } from "react"
import { AssistantQueue } from "./AssistantQueue"
import type { QueueNavMode } from "./queueNavMode"
import { useAssistantQueue } from "./useAssistantQueue"
import { filterHistoryPatients } from "./past-visits/pastVisits.helpers"

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

  const pastVisitsPatients = filterHistoryPatients(api.historyPatients)

  const selectedPatient = (() => {
    if (!api.selectedPatientId) return null
    if (queueNavMode === "history") {
      return (
        pastVisitsPatients.find((p) => p.queueEntryId === api.selectedPatientId) ??
        api.selectedPatient
      )
    }
    return api.selectedPatient
  })()

  return (
    <AssistantQueue
      patients={api.patients}
      stats={api.stats}
      filter={api.filter}
      setFilter={api.setFilter}
      searchTerm={api.searchTerm}
      setSearchTerm={api.setSearchTerm}
      tabCounts={api.tabCounts}
      onMarkArrived={api.markArrived}
      onMoveToWaiting={api.moveToWaiting}
      onNoShow={api.markNoShow}
      selectedPatient={selectedPatient}
      selectPatient={api.selectPatient}
      clearSelection={api.clearSelection}
      inClinicPatients={api.inClinicPatients}
      doctorLiveSnapshots={api.doctorLiveSnapshots}
      waitingTurnByQueueId={api.waitingTurnByQueueId}
      liveBoardLoading={api.liveBoardLoading}
      isLoading={api.isLoading}
      isError={api.isError}
      queueNavMode={queueNavMode}
      pastVisitsPatients={pastVisitsPatients}
      pastVisitsLoading={api.historyLoading}
    />
  )
}
