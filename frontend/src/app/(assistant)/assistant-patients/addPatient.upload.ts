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

export async function uploadAssistantPatientDocument(
  patientUserId: number,
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
      text || `File storage failed (${putRes.status}). Check S3 configuration and CORS.`,
    )
  }

  await apiClient.post(`/assistant/patients/${patientUserId}/documents`, {
    fileName: file.name,
    contentType,
    category: registerCategory,
    title,
    fileSize: file.size,
    s3Key: intent.key,
  })
}
