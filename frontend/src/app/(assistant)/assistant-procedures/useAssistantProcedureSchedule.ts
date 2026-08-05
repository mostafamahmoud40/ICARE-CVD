"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantKeys } from "@/lib/query-keys"
import { fetchAssistantProcedureSchedule } from "./assistantProcedures.api"

export function useAssistantProcedureSchedule(dateKey: string) {
  return useQuery({
    queryKey: assistantKeys.procedureSchedule(dateKey),
    queryFn: () => fetchAssistantProcedureSchedule(dateKey),
    staleTime: 30_000,
  })
}
