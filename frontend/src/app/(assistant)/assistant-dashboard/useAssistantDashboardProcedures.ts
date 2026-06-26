"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantKeys } from "@/lib/query-keys"
import { fetchAssistantProcedureOrders } from "../assistant-procedures/assistantProcedures.api"

export function useAssistantDashboardProcedures() {
  return useQuery({
    queryKey: assistantKeys.procedureOrdersDashboard(),
    queryFn: fetchAssistantProcedureOrders,
    staleTime: 60_000,
  })
}
