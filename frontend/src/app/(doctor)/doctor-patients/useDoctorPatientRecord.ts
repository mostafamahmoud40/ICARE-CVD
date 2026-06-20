"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDoctorPatientRecord } from "./doctorPatients.api"

export function useDoctorPatientRecord(patientId: string) {
  return useQuery({
    queryKey: ["doctor-patient-record", patientId],
    queryFn: () => fetchDoctorPatientRecord(patientId),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  })
}
