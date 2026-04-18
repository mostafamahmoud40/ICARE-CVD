"use client"

import { AssistantQueue } from "./AssistantQueue"
import { useAssistantQueue } from "./useAssistantQueue"

export function AssistantQueuePageContainer() {
  const {
    patients,
    stats,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    tabCounts,
    markArrived,
    moveToWaiting,
    markNoShow,
    selectedPatient,
    selectPatient,
    clearSelection,
    inClinicPatients,
  } = useAssistantQueue()

  return (
    <AssistantQueue
      patients={patients}
      stats={stats}
      filter={filter}
      setFilter={setFilter}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      tabCounts={tabCounts}
      onMarkArrived={markArrived}
      onMoveToWaiting={moveToWaiting}
      onNoShow={markNoShow}
      selectedPatient={selectedPatient}
      selectPatient={selectPatient}
      clearSelection={clearSelection}
      inClinicPatients={inClinicPatients}
    />
  )
}
