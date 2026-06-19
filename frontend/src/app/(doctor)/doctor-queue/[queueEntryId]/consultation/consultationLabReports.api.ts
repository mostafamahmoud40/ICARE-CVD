import { apiClient } from "@/lib/api-client"
import type { LabAnalysisBundle } from "./labMaterials.types"

export type ApiLabReportPanel = {
  id: string
  patientId: string
  documentId: string | null
  consultationId: string | null
  panelTitle: string | null
  analysisJson: string
  summary: string | null
  orderedBy: string | null
  resultAt: string
  createdAt: string
  document: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
    s3Key: string
  } | null
}

export async function fetchLabReportPanels(
  patientId: string,
  consultationId?: string,
): Promise<ApiLabReportPanel[]> {
  const { data } = await apiClient.get<ApiLabReportPanel[]>(
    `/doctor/patients/${patientId}/lab-report-panels`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function importLabReportPanel(
  patientId: string,
  payload: {
    documentId: string
    consultationId?: string
    panelTitle?: string
    analysis: LabAnalysisBundle
    orderedBy?: string
  },
): Promise<ApiLabReportPanel> {
  const { data } = await apiClient.post<ApiLabReportPanel>(
    `/doctor/patients/${patientId}/lab-report-panels`,
    payload,
  )
  return data
}

export async function deleteLabReportPanel(
  patientId: string,
  panelId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/lab-report-panels/${panelId}`)
}

export async function createPatientDocument(
  patientId: string,
  payload: {
    fileName: string
    contentType: string
    category: "lab_report"
    s3Key: string
    fileSize: number
  },
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/patients/${patientId}/documents`,
    payload,
  )
  return data
}

export async function uploadLabFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/documents/upload-intent`, {
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

export function parseAnalysisJson(raw: string): LabAnalysisBundle {
  const parsed = JSON.parse(raw) as LabAnalysisBundle
  return {
    facility: {
      hospitalName: parsed.facility?.hospitalName ?? "",
      labName: parsed.facility?.labName ?? "",
      doctorName: parsed.facility?.doctorName ?? "",
    },
    patient: {
      id: parsed.patient?.id ?? "",
      dateCollected: parsed.patient?.dateCollected ?? "",
      dateReported: parsed.patient?.dateReported ?? "",
    },
    results: Array.isArray(parsed.results) ? parsed.results : [],
    summary: parsed.summary ?? "",
  }
}
