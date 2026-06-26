import { apiClient } from "@/lib/api-client"

import type { UploadIntentResult } from "./types"

export async function putFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  contentType = file.type || "application/octet-stream",
): Promise<void> {
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  })

  if (!putRes.ok) {
    const text = await putRes.text().catch(() => "")
    throw new Error(
      text ||
        `File upload failed (${putRes.status}). Check MinIO configuration and CORS.`,
    )
  }
}

export async function uploadAvatarViaIntent(
  file: File,
  intentPath: string,
  patchPath: string,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"

  const intentRes = await apiClient.post<UploadIntentResult>(intentPath, {
    fileName: file.name,
    contentType,
  })

  await putFileToPresignedUrl(file, intentRes.data.uploadUrl, contentType)

  const { data } = await apiClient.patch<{ avatarUrl: string }>(patchPath, {
    s3Key: intentRes.data.key,
  })

  return data.avatarUrl
}

export async function uploadDocumentViaIntent(
  file: File,
  intentPath: string,
  registerPath: string,
  intentBody: Record<string, unknown>,
  registerBody: Record<string, unknown>,
): Promise<void> {
  const contentType = file.type || "application/octet-stream"

  const intentRes = await apiClient.post<UploadIntentResult>(intentPath, {
    fileName: file.name,
    contentType,
    ...intentBody,
  })

  await putFileToPresignedUrl(file, intentRes.data.uploadUrl, contentType)

  await apiClient.post(registerPath, {
    fileName: file.name,
    contentType,
    fileSize: file.size,
    s3Key: intentRes.data.key,
    ...registerBody,
  })
}
