"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  completeConsultationSession,
  completeQueueEntry,
} from "./consultation.api"

export type CompleteConsultationPhase = "idle" | "saving" | "publishing"

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
  const [phase, setPhase] = useState<CompleteConsultationPhase>("idle")

  const complete = useCallback(
    async ({
      patientId,
      consultationId,
      queueEntryId,
      saveVitals,
      saveSections,
      startedAt,
    }: CompleteConsultationInput) => {
      setPhase("saving")
      try {
        await saveVitals()
        await saveSections()

        setPhase("publishing")

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
          queryClient.invalidateQueries({ queryKey: ["patient-consultation", consultationId] }),
        ])

        showIcareSuccessToast(
          "Report published",
          "The visit summary is now available in the patient's consultation history.",
        )

        router.push(`/doctor-patients/${patientId}/consultations/${consultationId}`)
      } catch (error) {
        showIcareErrorToast(
          "Could not publish report",
          error instanceof Error ? error.message : "Please try again.",
        )
      } finally {
        setPhase("idle")
      }
    },
    [queryClient, router],
  )

  return {
    complete,
    phase,
    isCompleting: phase !== "idle",
    completingLabel:
      phase === "publishing" ? "Preparing report…" : phase === "saving" ? "Saving visit…" : "Complete & Sign",
  }
}
