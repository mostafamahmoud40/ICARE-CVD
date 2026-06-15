"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDoctorPatientStats, fetchDoctorPatients } from "./doctorPatients.api"

export function useDoctorPatients() {
  const patientsQuery = useQuery({
    queryKey: ["doctor-patients"],
    queryFn: fetchDoctorPatients,
    staleTime: 60_000,
  })

  const statsQuery = useQuery({
    queryKey: ["doctor-patients-stats"],
    queryFn: fetchDoctorPatientStats,
    staleTime: 60_000,
  })

  return {
    patients: patientsQuery.data ?? [],
    stats: statsQuery.data ?? {
      totalPatients: 0,
      highRiskCount: 0,
      complianceAlertsCount: 0,
    },
    isLoading: patientsQuery.isLoading || statsQuery.isLoading,
    isError: patientsQuery.isError || statsQuery.isError,
    refetch: async () => {
      await Promise.all([patientsQuery.refetch(), statsQuery.refetch()])
    },
  }
}
