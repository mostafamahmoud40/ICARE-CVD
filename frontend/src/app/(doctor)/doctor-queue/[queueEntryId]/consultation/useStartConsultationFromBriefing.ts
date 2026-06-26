"use client"

import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { acknowledgeBriefing } from "./briefingStorage"

export function useStartConsultationFromBriefing(queueEntryId: string) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return async function startConsultation() {
    acknowledgeBriefing(queueEntryId)
    try {
      await apiClient.patch(`/doctor/queue/${queueEntryId}/status`, {
        status: "in-consultation",
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-queue-stats"] }),
      ])
    } catch {
      // Continue into consultation even if status sync fails locally.
    }
    router.push(`/doctor-queue/${queueEntryId}/consultation/new`)
  }
}
