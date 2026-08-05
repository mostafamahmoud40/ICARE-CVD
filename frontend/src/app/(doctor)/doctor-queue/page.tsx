"use client"

import { DoctorQueue } from "./DoctorQueue"
import { useDoctorQueue } from "./useDoctorQueue"

export default function DoctorQueuePage() {
  const {
    patients,
    stats,
    filter,
    setFilter,
    tabCounts,
    markArrived,
    moveToWaiting,
    startConsultation,
    complete,
    markNoShow,
    isLoading,
    isError,
  } = useDoctorQueue()

  return (
    <DoctorQueue
      patients={patients}
      stats={stats}
      filter={filter}
      setFilter={setFilter}
      tabCounts={tabCounts}
      onMarkArrived={markArrived}
      onMoveToWaiting={moveToWaiting}
      onStartConsultation={startConsultation}
      onComplete={complete}
      onNoShow={markNoShow}
      isLoading={isLoading}
      isError={isError}
    />
  )
}
