"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { fetchDoctorPatientRecord } from "@/app/(doctor)/doctor-patients/doctorPatients.api"
import type { ConsultationData } from "./consultation.types"
import { createConsultationDataFromPatient } from "./consultation.template"
import { mapPatientFullRecordToSummary } from "./consultationPatient.mapper"

async function fetchQueuePatientId(queueEntryId: string): Promise<string> {
  const { data } = await apiClient.get<{ patientId: string }>(`/doctor/queue/${queueEntryId}`)
  return data.patientId
}

export function useConsultationDraft(queueEntryId: string): {
  data: ConsultationData | null
  setData: Dispatch<SetStateAction<ConsultationData | null>>
  hydrated: boolean
  isLoading: boolean
  isError: boolean
} {
  const [data, setData] = useState<ConsultationData | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
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

      try {
        const patientId = await fetchQueuePatientId(queueEntryId)
        const record = await fetchDoctorPatientRecord(patientId)
        const patientSummary = mapPatientFullRecordToSummary(record)
        const initial = createConsultationDataFromPatient(patientId, patientSummary)

        if (cancelled) return

        setData(initial)
        setHydrated(true)
        setIsLoading(false)
        void markSessionStarted()
      } catch {
        if (cancelled) return
        setIsError(true)
        setIsLoading(false)
        setHydrated(true)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [queueEntryId, markSessionStarted])

  return { data, setData, hydrated, isLoading, isError }
}
