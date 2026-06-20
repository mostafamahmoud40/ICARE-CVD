import { apiClient } from "@/lib/api-client"
import type { SegmentationResult } from "./CTScanSection"

export type ApiCtAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  fileName: string | null
  voxelCount: number
  predShape: number[]
  volumeMl: number
  elapsedSec: number
  createdAt: string
  sourceDocumentId: string | null
  maskDocumentId: string | null
  axialSliceDocumentId: string | null
  coronalSliceDocumentId: string | null
  sagittalSliceDocumentId: string | null
  axialUrl: string | null
  coronalUrl: string | null
  sagittalUrl: string | null
  maskUrl: string | null
  sourceDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
}

export type CtMlResult = {
  voxelCount: number
  predShape: [number, number, number]
  volumeMl: number
  elapsedSec: number
  slices: {
    axial: string
    coronal: string
    sagittal: string
  }
  maskB64: string
}

export async function fetchCtAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiCtAnalysis[]> {
  const { data } = await apiClient.get<ApiCtAnalysis[]>(
    `/doctor/patients/${patientId}/ct-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadCtFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/ct-analyses/upload-intent`, {
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

export async function createCtDocument(
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

export async function saveCtAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    sourceDocumentId: string
    maskDocumentId: string
    axialSliceDocumentId: string
    coronalSliceDocumentId: string
    sagittalSliceDocumentId: string
    fileName?: string
    voxelCount: number
    predShape: [number, number, number]
    volumeMl: number
    elapsedSec: number
  },
): Promise<ApiCtAnalysis> {
  const { data } = await apiClient.post<ApiCtAnalysis>(
    `/doctor/patients/${patientId}/ct-analyses`,
    payload,
  )
  return data
}

export async function deleteCtAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/ct-analyses/${analysisId}`)
}

export function base64ToFile(base64: string, fileName: string, mime: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(",")
  const mime = header?.match(/:(.*?);/)?.[1] ?? "image/png"
  return base64ToFile(base64 ?? "", fileName, mime)
}

export function apiToSegmentationResult(api: ApiCtAnalysis): SegmentationResult {
  return {
    voxelCount: api.voxelCount,
    predShape: api.predShape as [number, number, number],
    volumeMl: api.volumeMl,
    elapsedSec: api.elapsedSec,
    slices: {
      axial: api.axialUrl ?? "",
      coronal: api.coronalUrl ?? "",
      sagittal: api.sagittalUrl ?? "",
    },
    maskUrl: api.maskUrl ?? undefined,
  }
}

export function mlJsonToCtResult(json: Record<string, unknown>): CtMlResult {
  const slices = json.slices as Record<string, string>
  return {
    voxelCount: Number(json.voxel_count ?? 0),
    predShape: json.pred_shape as [number, number, number],
    volumeMl: Number(json.volume_ml ?? 0),
    elapsedSec: Number(json.elapsed_sec ?? 0),
    slices: {
      axial: slices.axial ?? "",
      coronal: slices.coronal ?? "",
      sagittal: slices.sagittal ?? "",
    },
    maskB64: String(json.mask_b64 ?? ""),
  }
}
