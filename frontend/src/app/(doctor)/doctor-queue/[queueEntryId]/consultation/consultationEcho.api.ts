import { apiClient } from "@/lib/api-client"
import type { EchoAnalysisResult } from "./useEchoAnalysis"

export type ApiEchoAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  fileName: string | null
  aiReport: string | null
  ef: number
  label: EchoAnalysisResult["label"]
  es_frame: number
  ed_frame: number
  es_area: number
  ed_area: number
  total_frames: number
  device: string
  chart_data: EchoAnalysisResult["chart_data"]
  createdAt: string
  updatedAt: string
  videoDocumentId: string | null
  overlayGifDocumentId: string | null
  frameVizDocumentId: string | null
  videoUrl: string | null
  overlayGifUrl: string | null
  frameVizUrl: string | null
  videoDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
}

export async function fetchEchoAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiEchoAnalysis[]> {
  const { data } = await apiClient.get<ApiEchoAnalysis[]>(
    `/doctor/patients/${patientId}/echo-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadEchoFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "video/mp4"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/echo-analyses/upload-intent`, {
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

export async function createEchoDocument(
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

export async function saveEchoAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    videoDocumentId: string
    overlayGifDocumentId: string
    frameVizDocumentId: string
    fileName?: string
  } & Omit<EchoAnalysisResult, "frame_viz" | "overlay_gif">,
): Promise<ApiEchoAnalysis> {
  const { data } = await apiClient.post<ApiEchoAnalysis>(
    `/doctor/patients/${patientId}/echo-analyses`,
    payload,
  )
  return data
}

export async function updateEchoReport(
  patientId: string,
  analysisId: string,
  aiReport: string,
): Promise<ApiEchoAnalysis> {
  const { data } = await apiClient.patch<ApiEchoAnalysis>(
    `/doctor/patients/${patientId}/echo-analyses/${analysisId}/report`,
    { aiReport },
  )
  return data
}

export async function deleteEchoAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/echo-analyses/${analysisId}`)
}

export function base64ToFile(base64: string, fileName: string, mime: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

export function apiEchoToAnalysisResult(api: ApiEchoAnalysis): EchoAnalysisResult {
  return {
    ef: api.ef,
    label: api.label,
    es_frame: api.es_frame,
    ed_frame: api.ed_frame,
    es_area: api.es_area,
    ed_area: api.ed_area,
    total_frames: api.total_frames,
    device: api.device,
    frame_viz: api.frameVizUrl ?? "",
    overlay_gif: api.overlayGifUrl ?? "",
    chart_data: api.chart_data,
  }
}
