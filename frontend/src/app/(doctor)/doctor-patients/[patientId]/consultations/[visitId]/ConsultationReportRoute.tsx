"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchDoctorPatientRecord } from "../../../doctorPatients.api"
import { fetchConsultationReport } from "../../../consultationReport.api"
import { ConsultationReportPage } from "./ConsultationReportPage"

export function ConsultationReportRoute({
  patientId,
  visitId,
}: {
  patientId: string
  visitId: string
}) {
  const patientQuery = useQuery({
    queryKey: ["doctor-patient-record", patientId],
    queryFn: () => fetchDoctorPatientRecord(patientId),
    staleTime: 60_000,
  })

  const reportQuery = useQuery({
    queryKey: ["consultation-report", patientId, visitId],
    queryFn: () => fetchConsultationReport(patientId, visitId),
    staleTime: 30_000,
  })

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
      patientName={patientQuery.data.patient.fullName}
      report={reportQuery.data}
    />
  )
}
