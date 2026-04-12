"use client"

import { useQuery } from "@tanstack/react-query"

import { mockAssistantDashboard } from "./assistantDashboard.mock"
import type { AssistantDashboardData } from "./assistantDashboard.types"

export function useAssistantDashboard() {
  return useQuery<AssistantDashboardData, Error>({
    queryKey: ["assistant-dashboard"],
    queryFn: async () => mockAssistantDashboard,
    staleTime: 5 * 60 * 1000,
  })
}
