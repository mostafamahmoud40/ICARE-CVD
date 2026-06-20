import { apiClient } from "@/lib/api-client"
import { validatePatientAvatarFile } from "@/app/(assistant)/assistant-patients/addPatient.upload"

export { validatePatientAvatarFile }

type UploadIntentResult = {
  key: string
  uploadUrl: string
  publicUrl?: string
  expiresIn: number
}

export async function uploadPatientAccountAvatar(file: File): Promise<string> {
  validatePatientAvatarFile(file)

  const contentType = file.type || "application/octet-stream"

  const intentRes = await apiClient.post<UploadIntentResult>(
    "/patient/account/avatar/upload-intent",
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

  const { data } = await apiClient.patch<{ avatarUrl: string }>("/patient/account/avatar", {
    s3Key: intent.key,
  })

  return data.avatarUrl
}
