import { apiClient } from "@/lib/api-client"
import type { ChatUploadIntentResult } from "./chat.types"

export type DirectoryUser = {
  profileId: string
  name: string
  role: string
  avatarUrl: string | null
  specialty: string | null
}

/**
 * Fetch the available user directory from the real backend.
 * Doctor → returns all patients
 * Patient → returns all doctors
 * Assistant → returns all doctors and patients
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

export async function requestChatUploadIntent(
  conversationId: string,
  payload: {
    fileName: string
    contentType: string
    attachmentType: "image" | "file"
  },
): Promise<ChatUploadIntentResult> {
  const { data } = await apiClient.post<ChatUploadIntentResult>(
    `/chat/conversations/${conversationId}/attachments/upload-intent`,
    payload,
  )
  return data
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function deleteChatMessage(conversationId: string, messageId: number) {
  await apiClient.delete(`/chat/conversations/${conversationId}/messages/${messageId}`)
}
