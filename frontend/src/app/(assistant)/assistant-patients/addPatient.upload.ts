import { apiClient } from "@/lib/api-client"
import {
  studyKindToPayload,
  type StudyKind,
} from "../assistant-queue/assistantQueue.documents.types"

type UploadIntentResult = {
  key: string
  uploadUrl: string
  publicUrl?: string
  expiresIn: number
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export function validatePatientAvatarFile(file: File) {
  if (!AVATAR_MIME_TYPES.has(file.type)) {
    throw new Error("Please choose a JPEG, PNG, WebP, or GIF image.")
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photo must be 5 MB or smaller.")
  }
}

export async function uploadPatientAvatar(
  patientId: string,
  file: File,
): Promise<string> {
  validatePatientAvatarFile(file)

  const contentType = file.type || "application/octet-stream"

  const intentRes = await apiClient.post<UploadIntentResult>(
    `/assistant/patients/${patientId}/avatar/upload-intent`,
    {
      fileName: file.name,
      contentType,
    },
  )

  const intent = intentRes.data

  const putRes = await fetch(intent.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  })

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "")
    throw new Error(
      text || `Profile photo upload failed (${putRes.status}). Check MinIO configuration and CORS.`,
    )
  }

  const { data } = await apiClient.patch<{ avatarUrl: string }>(
    `/assistant/patients/${patientId}/avatar`,
    { s3Key: intent.key },
  )

  return data.avatarUrl
}

export async function uploadAssistantPatientDocument(
  patientId: string,
  file: File,
  studyKind: StudyKind,
) {
  const { intentCategory, registerCategory, title } = studyKindToPayload(studyKind, file.name)
  const contentType = file.type || "application/octet-stream"

  const intentRes = await apiClient.post<UploadIntentResult>("/documents/upload-intent", {
    fileName: file.name,
    contentType,
    category: intentCategory,
  })

  const intent = intentRes.data

  const putRes = await fetch(intent.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  })

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "")
    throw new Error(
      text || `File storage failed (${putRes.status}). Check MinIO configuration and CORS.`,
    )
  }

  await apiClient.post(`/assistant/patients/${patientId}/documents`, {
    fileName: file.name,
    contentType,
    category: registerCategory,
    title,
    fileSize: file.size,
    s3Key: intent.key,
  })
}
