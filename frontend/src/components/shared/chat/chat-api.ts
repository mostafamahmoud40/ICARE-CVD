import { apiClient } from "@/lib/api-client"

export type DirectoryUser = {
  profileId: string
  name: string
  role: string
}

/**
 * Fetch the available user directory from the real backend.
 * Doctor → returns all patients
 * Patient → returns all doctors
 */
export async function fetchDirectory(): Promise<DirectoryUser[]> {
  const { data } = await apiClient.get<DirectoryUser[]>("/chat/directory")
  return data
}

/**
 * Create or retrieve an existing conversation.
 * Pass `patientId` when the caller is a doctor, `doctorId` when patient.
 */
export async function createOrGetConversation(payload: {
  patientId?: string
  doctorId?: string
}): Promise<{ id: number }> {
  const { data } = await apiClient.post<{ id: number }>("/chat/conversations", payload)
  return data
}
