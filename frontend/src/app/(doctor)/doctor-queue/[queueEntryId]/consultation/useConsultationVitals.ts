"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import { apiClient } from "@/lib/api-client"
import type { ConsultationVitalReading, VitalSigns } from "./consultation.types"
import {
  type ApiVitalRow,
  emptyVitalSigns,
  findTodayClinicReading,
  hasBpPairMismatch,
  hasPersistableVitalValue,
  mapApiRowToVitalSigns,
  mapConsultationReadingToVitalSigns,
  pickLastVitalReading,
  vitalSignsToApiPayload,
} from "./consultationVitals.utils"

type QueueEntryResponse = {
  patientId: string
  age: number
}

const SAVE_DEBOUNCE_MS = 900

async function fetchQueueEntry(queueEntryId: string): Promise<QueueEntryResponse> {
  const { data } = await apiClient.get<{
    patientId: string
    age: number
  }>(`/doctor/queue/${queueEntryId}`)
  return { patientId: data.patientId, age: data.age }
}

async function fetchPatientVitals(patientId: string): Promise<ApiVitalRow[]> {
  const { data } = await apiClient.get<ApiVitalRow[]>(
    `/doctor/patients/${patientId}/vitals`,
  )
  return data
}

export function useConsultationVitals(queueEntryId: string) {
  const [vitals, setVitals] = useState<VitalSigns>(emptyVitalSigns)
  const [lastVitalReading, setLastVitalReading] = useState<ConsultationVitalReading | null>(
    null,
  )
  const [sessionVitalId, setSessionVitalId] = useState<string | null>(null)
  const [patientAge, setPatientAge] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vitalsRef = useRef(vitals)
  const sessionVitalIdRef = useRef(sessionVitalId)
  const patientIdRef = useRef<string | null>(null)
  const hydratedRef = useRef(false)

  vitalsRef.current = vitals
  sessionVitalIdRef.current = sessionVitalId

  const contextQuery = useQuery({
    queryKey: ["consultation-queue-entry", queueEntryId],
    queryFn: () => fetchQueueEntry(queueEntryId),
    staleTime: 60_000,
  })

  const patientId = contextQuery.data?.patientId

  const vitalsQuery = useQuery({
    queryKey: ["consultation-patient-vitals", patientId],
    queryFn: () => fetchPatientVitals(patientId!),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })

  useEffect(() => {
    hydratedRef.current = false
  }, [queueEntryId])

  useEffect(() => {
    if (!contextQuery.data) return
    setPatientAge(contextQuery.data.age)
    patientIdRef.current = contextQuery.data.patientId
  }, [contextQuery.data])

  useEffect(() => {
    if (!vitalsQuery.data || hydratedRef.current) return

    hydratedRef.current = true
    const todayReading = findTodayClinicReading(vitalsQuery.data)
    if (todayReading) {
      setSessionVitalId(todayReading.id)
      setVitals(mapApiRowToVitalSigns(todayReading))
    } else {
      setSessionVitalId(null)
      setVitals(emptyVitalSigns())
    }

    setLastVitalReading(
      pickLastVitalReading(vitalsQuery.data, todayReading?.id ?? null),
    )
  }, [vitalsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async ({
      patientId: pid,
      vitalId,
      payload,
    }: {
      patientId: string
      vitalId: string | null
      payload: ReturnType<typeof vitalSignsToApiPayload>
    }) => {
      if (vitalId) {
        const { data } = await apiClient.patch<ApiVitalRow>(
          `/doctor/patients/${pid}/vitals/${vitalId}`,
          payload,
        )
        return data
      }
      const { data } = await apiClient.post<ApiVitalRow>(
        `/doctor/patients/${pid}/vitals`,
        payload,
      )
      return data
    },
    onSuccess: (row) => {
      setSessionVitalId(row.id)
    },
    onError: () => {
      showIcareErrorToast(
        "Could not save vitals",
        "Your changes were not saved. Please try again.",
      )
    },
  })

  const persistVitals = useCallback(
    async (next: VitalSigns, vitalId: string | null, pid: string) => {
      if (!hasPersistableVitalValue(next)) return
      if (hasBpPairMismatch(next)) return

      setIsSaving(true)
      try {
        await saveMutation.mutateAsync({
          patientId: pid,
          vitalId,
          payload: vitalSignsToApiPayload(next),
        })
      } finally {
        setIsSaving(false)
      }
    },
    [saveMutation],
  )

  const scheduleSave = useCallback(
    (next: VitalSigns) => {
      const pid = patientIdRef.current
      if (!pid) return

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        void persistVitals(next, sessionVitalIdRef.current, pid)
      }, SAVE_DEBOUNCE_MS)
    },
    [persistVitals],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const onVitalChange = useCallback(
    (key: keyof VitalSigns, value: string) => {
      setVitals((prev) => {
        const next = { ...prev, [key]: value }
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave],
  )

  const applyLastReading = useCallback(
    (reading: ConsultationVitalReading) => {
      const next = mapConsultationReadingToVitalSigns(reading)
      setVitals(next)
      const pid = patientIdRef.current
      if (pid) {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        void persistVitals(next, sessionVitalIdRef.current, pid)
      }
    },
    [persistVitals],
  )

  return {
    vitals,
    lastVitalReading,
    patientAge,
    onVitalChange,
    applyLastReading,
    isLoading: contextQuery.isLoading || vitalsQuery.isLoading,
    isError: contextQuery.isError || vitalsQuery.isError,
    isSaving: isSaving || saveMutation.isPending,
  }
}
