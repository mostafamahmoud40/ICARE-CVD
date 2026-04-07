"use client"

import { useQuery } from "@tanstack/react-query"

import { mockPatientDashboard } from "./dashboard.mock"
import type { PatientDashboardData } from "./dashboard.types"

export function usePatientDashboard() {
  return useQuery<PatientDashboardData, Error>({
    queryKey: ["patient-dashboard"],
    queryFn: async () => {
      // Temporary: return mock data until backend endpoints are confirmed.
      return mockPatientDashboard
    },
    staleTime: 5 * 60 * 1000,
  })
}

