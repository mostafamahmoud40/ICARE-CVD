"use client"

import { useConsultationReportRoute } from "./useConsultationReportRoute"
import { ConsultationReportPage } from "./ConsultationReportPage"

export function ConsultationReportRoute({
  patientId,
  visitId,
}: {
  patientId: string
  visitId: string
}) {
  const { patientQuery, reportQuery } = useConsultationReportRoute(patientId, visitId)

  if (patientQuery.isLoading || reportQuery.isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[14px] font-medium text-muted-foreground">Loading consultation report…</p>
      </main>
    )
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#102F27]">Patient not found</p>
          <p className="mt-1 text-[12px] text-muted-foreground">ID: {patientId}</p>
        </div>
      </main>
    )
  }

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#102F27]">Report not found</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            No detailed report is available for this consultation yet.
          </p>
        </div>
      </main>
    )
  }

  return (
    <ConsultationReportPage
      patientId={patientId}
      visitId={visitId}
      patientName={patientQuery.data.patient.fullName}
      report={reportQuery.data}
    />
  )
}
