"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ConsultationData } from "./consultation.types"
import { mockConsultationData } from "./consultation.mock"
import {
  loadConsultationDraft,
  saveConsultationDraft,
} from "./consultationDraftStorage"

export function useConsultationDraft(queueEntryId: string): {
  data: ConsultationData
  setData: Dispatch<SetStateAction<ConsultationData>>
  hydrated: boolean
  saveDraftNow: () => void
} {
  const [data, setData] = useState<ConsultationData>(mockConsultationData)
  const [hydrated, setHydrated] = useState(false)
  const baselineJsonRef = useRef<string>(JSON.stringify(mockConsultationData))
  const hadDraftOnLoadRef = useRef(false)
  const sessionStartedRef = useRef(false)
  const queryClient = useQueryClient()

  const markSessionStarted = useCallback(async () => {
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true
    try {
      await apiClient.patch(`/doctor/queue/${queueEntryId}/status`, {
        status: "in-consultation",
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-queue-stats"] }),
      ])
    } catch {
      sessionStartedRef.current = false
    }
  }, [queueEntryId, queryClient])

  useEffect(() => {
    const draft = loadConsultationDraft(queueEntryId)
    const initial = draft ?? mockConsultationData
    hadDraftOnLoadRef.current = draft !== null
    baselineJsonRef.current = JSON.stringify(initial)
    setData(initial)
    setHydrated(true)
    if (draft) void markSessionStarted()
  }, [queueEntryId, markSessionStarted])

  const persistIfNeeded = useCallback(
    (next: ConsultationData) => {
      const json = JSON.stringify(next)
      const isDirty = json !== baselineJsonRef.current
      if (!hadDraftOnLoadRef.current && !isDirty) return

      saveConsultationDraft(queueEntryId, next)
      void markSessionStarted()
    },
    [queueEntryId, markSessionStarted],
  )

  useEffect(() => {
    if (!hydrated) return
    persistIfNeeded(data)
  }, [data, hydrated, persistIfNeeded])

  const saveDraftNow = useCallback(() => {
    saveConsultationDraft(queueEntryId, data)
    void markSessionStarted()
  }, [data, queueEntryId, markSessionStarted])

  return { data, setData, hydrated, saveDraftNow }
}
