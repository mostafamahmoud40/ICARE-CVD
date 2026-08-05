"use client"

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"

import type { PatientQueueTodayResponse } from "./patientQueue.types"

async function fetchPatientQueueToday(): Promise<PatientQueueTodayResponse> {
  const { data } = await apiClient.get<PatientQueueTodayResponse>("/patient/queue/today")
  return data
}

export function usePatientQueue() {
  return useQuery<PatientQueueTodayResponse, Error>({
    queryKey: ["patient-queue-today"],
    queryFn: fetchPatientQueueToday,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
