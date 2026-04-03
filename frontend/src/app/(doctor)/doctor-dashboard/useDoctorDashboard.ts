"use client"

import { useQuery } from "@tanstack/react-query"

import { mockDoctorDashboard } from "./doctorDashboard.types"
import type { DoctorDashboardData } from "./doctorDashboard.types"

export function useDoctorDashboard() {
  return useQuery<DoctorDashboardData, Error>({
    queryKey: ["doctor-dashboard"],
    queryFn: async () => mockDoctorDashboard,
    staleTime: 5 * 60 * 1000,
  })
}

