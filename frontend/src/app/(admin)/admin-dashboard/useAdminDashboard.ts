"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchAdminDashboard } from "./adminDashboard.api"
import type { AdminDashboardData } from "./adminDashboard.types"

export function useAdminDashboard() {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ["admin-dashboard"],
    queryFn: fetchAdminDashboard,
    staleTime: 60 * 1000,
  })
}
