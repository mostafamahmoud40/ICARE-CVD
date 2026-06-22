"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchDoctorDashboard } from "./doctorDashboard.api"
import type { DoctorDashboardData } from "./doctorDashboard.types"

export function useDoctorDashboard() {
  return useQuery<DoctorDashboardData, Error>({
    queryKey: ["doctor-dashboard"],
    queryFn: fetchDoctorDashboard,
    staleTime: 60 * 1000,
  })
}
