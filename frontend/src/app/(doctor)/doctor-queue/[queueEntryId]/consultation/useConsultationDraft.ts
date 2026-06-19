"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { fetchDoctorPatientRecord } from "@/app/(doctor)/doctor-patients/doctorPatients.api"
import type { ConsultationData } from "./consultation.types"
import { createConsultationDataFromPatient } from "./consultation.template"
import { mapPatientFullRecordToSummary } from "./consultationPatient.mapper"
import {
  loadConsultationDraft,
  saveConsultationDraft,
} from "./consultationDraftStorage"

async function fetchQueuePatientId(queueEntryId: string): Promise<string> {
  const { data } = await apiClient.get<{ patientId: string }>(`/doctor/queue/${queueEntryId}`)
  return data.patientId
}

function mergeConsultationWithPatient(
  draft: ConsultationData | null,
  patientId: string,
  patientSummary: ConsultationData["patientSummary"],
): ConsultationData {
  const base = createConsultationDataFromPatient(patientId, patientSummary)

  if (!draft) return base

  return {
    ...draft,
    patientId,
    patientSummary,
    medicalHistory: {
      ...draft.medicalHistory,
      noKnownAllergies: patientSummary.allergies.length === 0,
      noChronicConditions: patientSummary.existingConditions.length === 0,
    },
    aiSuggestions: draft.aiSuggestions.length > 0 ? draft.aiSuggestions : base.aiSuggestions,
  }
}

export function useConsultationDraft(queueEntryId: string): {
  data: ConsultationData | null
  setData: Dispatch<SetStateAction<ConsultationData | null>>
  hydrated: boolean
  isLoading: boolean
  isError: boolean
  saveDraftNow: () => void
} {
  const [data, setData] = useState<ConsultationData | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const baselineJsonRef = useRef<string>("")
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
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setIsError(false)
      setHydrated(false)

      const draft = loadConsultationDraft(queueEntryId)

      try {
        const patientId = await fetchQueuePatientId(queueEntryId)
        const record = await fetchDoctorPatientRecord(patientId)
        const patientSummary = mapPatientFullRecordToSummary(record)
        const initial = mergeConsultationWithPatient(draft, patientId, patientSummary)

        if (cancelled) return

        hadDraftOnLoadRef.current = draft !== null
        baselineJsonRef.current = JSON.stringify(initial)
        setData(initial)
        setHydrated(true)
        setIsLoading(false)
        if (draft) void markSessionStarted()
      } catch {
        if (cancelled) return
        setIsError(true)
        setIsLoading(false)
        setHydrated(true)
        if (draft) {
          setData(draft)
          hadDraftOnLoadRef.current = true
          baselineJsonRef.current = JSON.stringify(draft)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
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
    if (!hydrated || !data) return
    persistIfNeeded(data)
  }, [data, hydrated, persistIfNeeded])

  const saveDraftNow = useCallback(() => {
    if (!data) return
    saveConsultationDraft(queueEntryId, data)
    void markSessionStarted()
  }, [data, queueEntryId, markSessionStarted])

  return { data, setData, hydrated, isLoading, isError, saveDraftNow }
}
