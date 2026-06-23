"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchPatientAiChatHealthContext } from "./patientAiChatContext.api"
import type { PatientAiChatHealthContext } from "./patientAiChatContext.types"
import { emptyCurrentVitals } from "../vitals/vitals.types"

const queryKey = ["patient-ai-chat-context"] as const

const emptyContext: PatientAiChatHealthContext = {
  profile: null,
  riskScore: null,
  riskNote: null,
  vitals: {
    current: emptyCurrentVitals,
    kpiBadges: {
      bloodPressure: null,
      heartRate: null,
      spo2: null,
      weight: null,
    },
    lastMeasuredAt: null,
  },
  medications: [],
  labResults: [],
}

export function usePatientAiChatContext() {
  const query = useQuery({
    queryKey,
    queryFn: fetchPatientAiChatHealthContext,
    staleTime: 2 * 60 * 1000,
  })

  return {
    ...query,
    context: query.data ?? emptyContext,
  }
}
