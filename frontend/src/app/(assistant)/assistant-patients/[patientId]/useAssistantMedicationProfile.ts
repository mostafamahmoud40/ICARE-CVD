"use client"

import { useQuery } from "@tanstack/react-query"

import { assistantKeys } from "@/lib/query-keys"
import { fetchAssistantMedicationProfile } from "@/app/(assistant)/assistant-medications/assistantMedications.api"

export function useAssistantMedicationProfile(patientId: string) {
  return useQuery({
    queryKey: assistantKeys.medicationProfile(patientId),
    queryFn: () => fetchAssistantMedicationProfile(patientId),
    retry: false,
  })
}
