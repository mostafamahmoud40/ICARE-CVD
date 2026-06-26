"use client"

import { useQuery } from "@tanstack/react-query"

import { patientKeys } from "@/lib/query-keys"
import { fetchDoctorPatientRecord } from "../../../doctorPatients.api"
import { fetchConsultationReport } from "../../../consultationReport.api"

export function useConsultationReportRoute(patientId: string, visitId: string) {
  const patientQuery = useQuery({
    queryKey: patientKeys.doctorRecord(patientId),
    queryFn: () => fetchDoctorPatientRecord(patientId),
    staleTime: 60_000,
  })

  const reportQuery = useQuery({
    queryKey: patientKeys.consultationReport(patientId, visitId),
    queryFn: () => fetchConsultationReport(patientId, visitId),
    staleTime: 30_000,
  })

  return { patientQuery, reportQuery }
}
