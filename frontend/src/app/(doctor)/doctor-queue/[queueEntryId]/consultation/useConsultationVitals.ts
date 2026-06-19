"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
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

function canPersistVitals(vitals: VitalSigns): string | null {
  if (!hasPersistableVitalValue(vitals)) {
    return "Enter at least one vital sign before saving."
  }
  if (hasBpPairMismatch(vitals)) {
    return "Enter both systolic and diastolic blood pressure, or leave both empty."
  }
  return null
}

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
  const [isDirty, setIsDirty] = useState(false)
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
    setIsDirty(false)
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
      setIsDirty(false)
      showIcareSuccessToast("Vitals saved", "Patient vital signs were saved to the record.")
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
      const validationError = canPersistVitals(next)
      if (validationError) {
        showIcareErrorToast("Cannot save vitals", validationError)
        return false
      }

      setIsSaving(true)
      try {
        await saveMutation.mutateAsync({
          patientId: pid,
          vitalId,
          payload: vitalSignsToApiPayload(next),
        })
        return true
      } catch {
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [saveMutation],
  )

  const saveNow = useCallback(async () => {
    const pid = patientIdRef.current
    if (!pid) return

    await persistVitals(vitalsRef.current, sessionVitalIdRef.current, pid)
  }, [persistVitals])

  const onVitalChange = useCallback((key: keyof VitalSigns, value: string) => {
    setVitals((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }, [])

  const applyLastReading = useCallback((reading: ConsultationVitalReading) => {
    const next = mapConsultationReadingToVitalSigns(reading)
    setVitals(next)
    setIsDirty(true)
  }, [])

  return {
    vitals,
    lastVitalReading,
    patientAge,
    onVitalChange,
    applyLastReading,
    saveNow,
    isDirty,
    canSave: isDirty && canPersistVitals(vitals) === null,
    isLoading: contextQuery.isLoading || vitalsQuery.isLoading,
    isError: contextQuery.isError || vitalsQuery.isError,
    isSaving: isSaving || saveMutation.isPending,
  }
}
