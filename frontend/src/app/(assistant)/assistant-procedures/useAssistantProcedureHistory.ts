"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantKeys } from "@/lib/query-keys"
import { fetchAssistantProcedureHistory } from "./assistantProcedures.api"

export function useAssistantProcedureHistory(
  dateFilter: string,
  searchTerm: string,
) {
  return useQuery({
    queryKey: assistantKeys.procedureHistory(dateFilter, searchTerm),
    queryFn: () => fetchAssistantProcedureHistory(dateFilter, searchTerm),
    staleTime: 30_000,
  })
}
