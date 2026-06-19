import { apiClient } from "@/lib/api-client"

export type XrayRiskLevel = "high" | "moderate" | "normal"

export type ApiXrayAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  fileName: string | null
  riskLevel: XrayRiskLevel
  findings: Record<string, number>
  interpretation: string[]
  totalDetections: number
  inferenceTimeMs: number
  createdAt: string
  originalDocumentId: string | null
  annotatedDocumentId: string | null
  originalImageUrl: string | null
  annotatedImageUrl: string | null
  originalDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
  annotatedDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
}

export type XrayMlResult = {
  findings: Record<string, number>
  riskLevel: XrayRiskLevel
  interpretation: string[]
  originalB64: string
  annotatedB64: string
  totalDetections: number
  inferenceTimeMs: number
}

export async function fetchXrayAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiXrayAnalysis[]> {
  const { data } = await apiClient.get<ApiXrayAnalysis[]>(
    `/doctor/patients/${patientId}/xray-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadXrayFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "image/jpeg"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/xray-analyses/upload-intent`, {
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

export async function createXrayDocument(
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

export async function saveXrayAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    originalDocumentId: string
    annotatedDocumentId: string
    fileName?: string
    riskLevel: XrayRiskLevel
    findings: Record<string, number>
    interpretation: string[]
    totalDetections: number
    inferenceTimeMs: number
  },
): Promise<ApiXrayAnalysis> {
  const { data } = await apiClient.post<ApiXrayAnalysis>(
    `/doctor/patients/${patientId}/xray-analyses`,
    payload,
  )
  return data
}

export async function deleteXrayAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/xray-analyses/${analysisId}`)
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(",")
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/jpeg"
  const binary = atob(base64 ?? "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

export function annotatedFileName(sourceName: string): string {
  const dot = sourceName.lastIndexOf(".")
  if (dot === -1) return `${sourceName}-annotated.jpg`
  const base = sourceName.slice(0, dot)
  const ext = sourceName.slice(dot + 1) || "jpg"
  return `${base}-annotated.${ext}`
}
