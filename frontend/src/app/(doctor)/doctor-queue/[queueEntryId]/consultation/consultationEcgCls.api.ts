import { apiClient } from "@/lib/api-client"

export type EcgClsInputSource = "image" | "wfdb"

export type EcgClassificationResult = {
  prediction: string
  confidence: number
  probabilities: Record<string, number>
  color: string
  source: EcgClsInputSource
  sig_names?: string[]
  sampling_rate?: number
  input_preview_b64?: string
}

export type ApiEcgClsAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  inputSource: EcgClsInputSource
  fileName: string | null
  classification: EcgClassificationResult
  createdAt: string
  previewUrl: string | null
  imageUrl: string | null
  imageDocumentId: string | null
  heaDocumentId: string | null
  datDocumentId: string | null
  previewDocumentId: string | null
  imageDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
  heaDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
  datDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
}

export async function fetchEcgClsAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiEcgClsAnalysis[]> {
  const { data } = await apiClient.get<ApiEcgClsAnalysis[]>(
    `/doctor/patients/${patientId}/ecg-cls-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadEcgClsFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/ecg-cls-analyses/upload-intent`, {
    fileName: file.name,
    contentType,
  })

  const response = await fetch(intent.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  })

  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status})`)
  }

  return intent.key
}

export async function createEcgClsDocument(
  patientId: string,
  payload: {
    fileName: string
    contentType: string
    s3Key: string
    fileSize: number
    title?: string
  },
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/patients/${patientId}/documents`,
    {
      fileName: payload.fileName,
      contentType: payload.contentType,
      category: "imaging",
      s3Key: payload.s3Key,
      fileSize: payload.fileSize,
      title: payload.title,
    },
  )
  return data
}

export async function saveEcgClsAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    inputSource: EcgClsInputSource
    imageDocumentId?: string
    heaDocumentId?: string
    datDocumentId?: string
    previewDocumentId?: string
    fileName?: string
    classification: EcgClassificationResult
  },
): Promise<ApiEcgClsAnalysis> {
  const { data } = await apiClient.post<ApiEcgClsAnalysis>(
    `/doctor/patients/${patientId}/ecg-cls-analyses`,
    payload,
  )
  return data
}

export async function deleteEcgClsAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(
    `/doctor/patients/${patientId}/ecg-cls-analyses/${analysisId}`,
  )
}

export function base64ToFile(base64: string, fileName: string, mime: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

export function apiToClassificationResult(
  api: ApiEcgClsAnalysis,
): EcgClassificationResult & { previewUrl?: string | null } {
  return {
    ...api.classification,
    previewUrl: api.previewUrl ?? api.imageUrl,
  }
}
