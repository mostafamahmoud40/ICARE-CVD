"use client"

import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"

import { mockPatientQueueToday } from "./patientQueue.mock"
import type { PatientQueueTodayResponse } from "./patientQueue.types"

async function fetchPatientQueueToday(): Promise<PatientQueueTodayResponse> {
  try {
    const { data } = await apiClient.get<PatientQueueTodayResponse>("/patient/queue/today")
    return data
  } catch {
    return mockPatientQueueToday
  }
}

export function usePatientQueue() {
  return useQuery<PatientQueueTodayResponse, Error>({
    queryKey: ["patient-queue-today"],
    queryFn: fetchPatientQueueToday,
    staleTime: 30 * 1000,
  })
}
