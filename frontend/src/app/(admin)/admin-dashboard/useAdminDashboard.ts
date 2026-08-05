"use client"

import { useQuery } from "@tanstack/react-query"

import { mockAdminDashboard } from "./adminDashboard.mock"
import type { AdminDashboardData } from "./adminDashboard.types"

export function useAdminDashboard() {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => mockAdminDashboard,
    staleTime: 5 * 60 * 1000,
  })
}
