import { apiClient } from "@/lib/api-client"
import type { EcgReport, EcgResult } from "./ecgAnalysis.types"

export type ApiEcgAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  recordName: string | null
  fileName: string | null
  analysis: EcgResult
  aiReport: EcgReport | null
  createdAt: string
  updatedAt: string
  heaDocumentId: string | null
  datDocumentId: string | null
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

export async function fetchEcgAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiEcgAnalysis[]> {
  const { data } = await apiClient.get<ApiEcgAnalysis[]>(
    `/doctor/patients/${patientId}/ecg-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadEcgFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/ecg-analyses/upload-intent`, {
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

export async function createEcgDocument(
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

export async function saveEcgAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    heaDocumentId: string
    datDocumentId: string
    recordName?: string
    fileName?: string
    analysis: EcgResult
    aiReport?: EcgReport
  },
): Promise<ApiEcgAnalysis> {
  const { data } = await apiClient.post<ApiEcgAnalysis>(
    `/doctor/patients/${patientId}/ecg-analyses`,
    payload,
  )
  return data
}

export async function updateEcgReport(
  patientId: string,
  analysisId: string,
  aiReport: EcgReport,
): Promise<ApiEcgAnalysis> {
  const { data } = await apiClient.patch<ApiEcgAnalysis>(
    `/doctor/patients/${patientId}/ecg-analyses/${analysisId}/report`,
    { aiReport },
  )
  return data
}

export async function deleteEcgAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/ecg-analyses/${analysisId}`)
}
