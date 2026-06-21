"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDoctorPatientRecord } from "@/app/(doctor)/doctor-patients/doctorPatients.api"
import { apiClient } from "@/lib/api-client"

async function fetchPatientAvatarUrl(queueEntryId: string): Promise<string | null> {
  const { data } = await apiClient.get<{ patientId: string }>(`/doctor/queue/${queueEntryId}`)
  const record = await fetchDoctorPatientRecord(data.patientId)
  return record.patient.profileImageUrl?.trim() || null
}

export function useBriefingPatientAvatar(queueEntryId: string) {
  return useQuery({
    queryKey: ["briefing-patient-avatar", queueEntryId],
    queryFn: () => fetchPatientAvatarUrl(queueEntryId),
    staleTime: 60_000,
  })
}
