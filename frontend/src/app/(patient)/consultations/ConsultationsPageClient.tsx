"use client"

import { ConsultationsContent } from "./ConsultationsContent"
import { usePatientConsultationStats } from "./usePatientConsultations"

export function ConsultationsPageClient() {
  const { data: visits = [], stats, isLoading, isError } = usePatientConsultationStats()

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[14px] font-medium text-muted-foreground">Loading your consultations…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[14px] font-medium text-muted-foreground">
          Could not load your consultation history.
        </p>
      </div>
    )
  }

  return <ConsultationsContent visits={visits} stats={stats} />
}
