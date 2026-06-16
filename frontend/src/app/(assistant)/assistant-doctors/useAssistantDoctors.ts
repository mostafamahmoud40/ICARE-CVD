"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { AssistantDoctorClinicProfile, AssistantDoctorDirectoryItem } from "./assistantDoctors.types"

export const assistantDoctorsDirectoryKey = ["assistant-doctors-directory"] as const

export const assistantDoctorClinicProfileKey = (doctorId: string) =>
  ["assistant-doctor-clinic-profile", doctorId] as const

async function fetchDoctorDirectory(): Promise<AssistantDoctorDirectoryItem[]> {
  const { data } = await apiClient.get<AssistantDoctorDirectoryItem[]>(
    "/assistant/doctors/directory",
  )
  return data
}

async function fetchDoctorClinicProfile(
  doctorId: string,
): Promise<AssistantDoctorClinicProfile> {
  const { data } = await apiClient.get<AssistantDoctorClinicProfile>(
    `/assistant/doctors/${doctorId}/clinic-profile`,
  )
  return data
}

export function useAssistantDoctorsDirectory() {
  return useQuery({
    queryKey: assistantDoctorsDirectoryKey,
    queryFn: fetchDoctorDirectory,
    staleTime: 30 * 1000,
  })
}

export function useAssistantDoctorClinicProfile(doctorId: string | null) {
  return useQuery({
    queryKey: assistantDoctorClinicProfileKey(doctorId ?? ""),
    queryFn: () => fetchDoctorClinicProfile(doctorId!),
    enabled: Boolean(doctorId),
    staleTime: 60 * 1000,
  })
}
