"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { QueueVisitOutcomes } from "./assistantQueue.visitOutcomes.types"

export const assistantQueueVisitOutcomesQueryKey = (queueEntryId: string | null) =>
  ["assistant-queue-visit-outcomes", queueEntryId] as const

export function useAssistantQueueVisitOutcomes(queueEntryId: string | null) {
  const query = useQuery({
    queryKey: assistantQueueVisitOutcomesQueryKey(queueEntryId),
    queryFn: async () => {
      const { data } = await apiClient.get<QueueVisitOutcomes>(
        `/assistant/patient-queue/${queueEntryId}/visit-outcomes`,
      )
      return data
    },
    enabled: Boolean(queueEntryId),
  })

  return {
    outcomes: query.data ?? null,
    isLoadingOutcomes: query.isLoading,
    isOutcomesError: query.isError,
    refetchOutcomes: query.refetch,
  }
}
