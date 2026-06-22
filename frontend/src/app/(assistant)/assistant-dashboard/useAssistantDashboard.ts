"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchAssistantDashboard } from "./assistantDashboard.api"
import type { AssistantDashboardData } from "./assistantDashboard.types"

export function useAssistantDashboard() {
  return useQuery<AssistantDashboardData, Error>({
    queryKey: ["assistant-dashboard"],
    queryFn: fetchAssistantDashboard,
    staleTime: 60 * 1000,
  })
}
