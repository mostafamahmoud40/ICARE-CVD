"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import {
  completeConsultationSession,
  completeQueueEntry,
} from "./consultation.api"

type CompleteConsultationInput = {
  patientId: string
  consultationId: string
  queueEntryId: string
  saveVitals: () => Promise<void>
  saveSections: () => Promise<void>
  startedAt?: string | null
}

export function useCompleteConsultation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCompleting, setIsCompleting] = useState(false)

  const complete = useCallback(
    async ({
      patientId,
      consultationId,
      queueEntryId,
      saveVitals,
      saveSections,
      startedAt,
    }: CompleteConsultationInput) => {
      setIsCompleting(true)
      try {
        await saveVitals()
        await saveSections()

        let durationMinutes: number | undefined
        if (startedAt) {
          const elapsedMs = Date.now() - Date.parse(startedAt)
          if (Number.isFinite(elapsedMs) && elapsedMs > 0) {
            durationMinutes = Math.max(1, Math.round(elapsedMs / 60_000))
          }
        }

        await completeConsultationSession(patientId, consultationId, durationMinutes)
        await completeQueueEntry(queueEntryId)

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["consultation-session", queueEntryId] }),
          queryClient.invalidateQueries({ queryKey: ["doctor-patient-record", patientId] }),
          queryClient.invalidateQueries({ queryKey: ["patient-consultations"] }),
        ])

        router.push(`/doctor-patients/${patientId}/consultations/${consultationId}`)
      } catch (error) {
        showIcareErrorToast(
          "Could not complete consultation",
          error instanceof Error ? error.message : "Please try again.",
        )
      } finally {
        setIsCompleting(false)
      }
    },
    [queryClient, router],
  )

  return { complete, isCompleting }
}
