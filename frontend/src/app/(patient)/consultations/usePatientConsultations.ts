"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchPatientConsultation, fetchPatientConsultations } from "./patientConsultations.api"
import { computeConsultationStats } from "./consultations.utils"

export function usePatientConsultations() {
  return useQuery({
    queryKey: ["patient-consultations"],
    queryFn: fetchPatientConsultations,
    staleTime: 30_000,
  })
}

export function usePatientConsultation(consultationId: string) {
  return useQuery({
    queryKey: ["patient-consultation", consultationId],
    queryFn: () => fetchPatientConsultation(consultationId),
    staleTime: 30_000,
  })
}

export function usePatientConsultationStats() {
  const query = usePatientConsultations()
  return {
    ...query,
    stats: computeConsultationStats(query.data ?? []),
  }
}
