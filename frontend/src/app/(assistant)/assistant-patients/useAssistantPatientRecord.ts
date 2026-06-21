"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  fetchAssistantAppointments,
  fetchAssistantPatientRecord,
} from "./assistantPatientProfile.api"
import {
  mapAppointments,
  mapDocumentsProps,
  mapLabResults,
  mapMedicalHistoryProps,
  mapPatientSummary,
  mapPrescriptions,
  mapVisitHistory,
  mapVitalSummaryCards,
  mapVitalsHistory,
  mapVitalsTrend,
} from "./assistantPatientProfile.mapper"

export function useAssistantPatientRecord(patientId: string) {
  const recordQuery = useQuery({
    queryKey: ["assistant-patient-record", patientId],
    queryFn: () => fetchAssistantPatientRecord(patientId),
    enabled: Boolean(patientId),
    staleTime: 60_000,
  })

  const appointmentsQuery = useQuery({
    queryKey: ["assistant-appointments"],
    queryFn: fetchAssistantAppointments,
    staleTime: 60_000,
  })

  const mapped = useMemo(() => {
    const record = recordQuery.data
    if (!record) {
      return null
    }

    return {
      patient: mapPatientSummary(record),
      vitals: mapVitalSummaryCards(record.latestVitals),
      vitalsHistory: mapVitalsHistory(record.vitalReadings),
      vitalsTrend: mapVitalsTrend(record.vitalReadings),
      appointments: mapAppointments(appointmentsQuery.data ?? [], patientId),
      visitHistory: mapVisitHistory(record.visits),
      labResults: mapLabResults(record.labResults),
      prescriptions: mapPrescriptions(record.medications),
      medicalHistory: mapMedicalHistoryProps(record),
      documents: mapDocumentsProps(record),
    }
  }, [appointmentsQuery.data, patientId, recordQuery.data])

  return {
    ...mapped,
    isLoading: recordQuery.isLoading,
    isError: recordQuery.isError,
    refetch: recordQuery.refetch,
  }
}
