"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantKeys } from "@/lib/query-keys"
import {
  fetchAssistantProcedureHistory,
  fetchAssistantProcedureOrders,
} from "./assistantProcedures.api"

export function useAssistantProcedureReportData() {
  const ordersQuery = useQuery({
    queryKey: assistantKeys.procedures(),
    queryFn: fetchAssistantProcedureOrders,
  })

  const historyQuery = useQuery({
    queryKey: assistantKeys.procedureHistory("all", ""),
    queryFn: () => fetchAssistantProcedureHistory("all"),
  })

  return { ordersQuery, historyQuery }
}
