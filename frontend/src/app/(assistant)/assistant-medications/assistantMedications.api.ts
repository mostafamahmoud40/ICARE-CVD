import { apiClient } from "@/lib/api-client"
import type { PatientMedicationProfile } from "./assistantMedications.types"

export type ApiPatientMedicationProfile = PatientMedicationProfile & {
  patientNumber: string
  avatarUrl?: string | null
}

export async function fetchAssistantMedicationProfiles(): Promise<
  ApiPatientMedicationProfile[]
> {
  const { data } = await apiClient.get<ApiPatientMedicationProfile[]>(
    "/assistant/medications/profiles",
  )
  return data
}

export async function fetchAssistantMedicationProfile(
  patientId: string,
): Promise<ApiPatientMedicationProfile> {
  const { data } = await apiClient.get<ApiPatientMedicationProfile>(
    `/assistant/medications/profiles/${encodeURIComponent(patientId)}`,
  )
  return data
}

export async function createAssistantMedicationFlag(payload: {
  patientId: string
  medicationId: string
  severity: "info" | "watch" | "critical"
  reason: string
}) {
  const { data } = await apiClient.post("/assistant/medications/flags", payload)
  return data
}

export async function resolveAssistantMedicationFlag(
  flagId: string,
  resolutionNote?: string,
) {
  await apiClient.patch(`/assistant/medications/flags/${flagId}/resolve`, {
    resolutionNote,
  })
}

export async function updateAssistantMedicationInstructions(
  medicationId: string,
  instructions: string,
) {
  await apiClient.patch(`/assistant/medications/${medicationId}/instructions`, {
    instructions,
  })
}

export async function createAssistantMedicationContact(payload: {
  patientId: string
  channel: "sms" | "push" | "call"
  summary: string
  messagePreview: string
}) {
  const { data } = await apiClient.post("/assistant/medications/contact-log", payload)
  return data
}

export async function createAssistantMedicationEscalation(payload: {
  patientId: string
  medicationId?: string | null
  priority: "routine" | "urgent" | "critical"
  reason: string
  note: string
}) {
  const { data } = await apiClient.post("/assistant/medications/escalations", payload)
  return data
}

export async function dismissAssistantMedicationInsight(
  patientId: string,
  insightKey: string,
) {
  await apiClient.post(
    `/assistant/medications/insights/${encodeURIComponent(insightKey)}/dismiss`,
    { patientId },
  )
}
