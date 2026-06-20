import { apiClient } from "@/lib/api-client"
import type {
  MriClinicalFeatures,
  MriDiagnosisClass,
  MriResult,
} from "./CineMRISection"

export type ApiCineMriAnalysis = {
  id: string
  patientId: string
  consultationId: string | null
  diagnosisClass: MriDiagnosisClass
  elapsedSec: number
  clinicalFeatures: MriClinicalFeatures
  createdAt: string
  edDocumentId: string | null
  esDocumentId: string | null
  rawGifDocumentId: string | null
  segGifDocumentId: string | null
  segGridEdDocumentId: string | null
  segGridEsDocumentId: string | null
  rawGifUrl: string | null
  segGifUrl: string | null
  segGridEdUrl: string | null
  segGridEsUrl: string | null
  edDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
  esDocument: {
    id: string
    fileName: string | null
    contentType: string | null
    sizeBytes: number | null
  } | null
}

export type MriMlResult = {
  diagnosisClass: MriDiagnosisClass
  elapsedSec: number
  clinicalFeatures: MriClinicalFeatures
  rawGifB64: string
  segGifB64: string
  segGridEdB64: string
  segGridEsB64: string
}

export async function fetchCineMriAnalyses(
  patientId: string,
  consultationId?: string,
): Promise<ApiCineMriAnalysis[]> {
  const { data } = await apiClient.get<ApiCineMriAnalysis[]>(
    `/doctor/patients/${patientId}/cine-mri-analyses`,
    { params: consultationId ? { consultationId } : undefined },
  )
  return data
}

export async function uploadCineMriFileToStorage(
  patientId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/doctor/patients/${patientId}/cine-mri-analyses/upload-intent`, {
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

export async function createCineMriDocument(
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

export async function saveCineMriAnalysis(
  patientId: string,
  payload: {
    consultationId?: string
    edDocumentId: string
    esDocumentId: string
    rawGifDocumentId: string
    segGifDocumentId: string
    segGridEdDocumentId: string
    segGridEsDocumentId: string
    diagnosisClass: MriDiagnosisClass
    elapsedSec: number
    clinicalFeatures: MriClinicalFeatures
  },
): Promise<ApiCineMriAnalysis> {
  const { data } = await apiClient.post<ApiCineMriAnalysis>(
    `/doctor/patients/${patientId}/cine-mri-analyses`,
    payload,
  )
  return data
}

export async function deleteCineMriAnalysis(
  patientId: string,
  analysisId: string,
): Promise<void> {
  await apiClient.delete(
    `/doctor/patients/${patientId}/cine-mri-analyses/${analysisId}`,
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

export function apiToMriResult(api: ApiCineMriAnalysis): MriResult {
  return {
    diagnosisClass: api.diagnosisClass,
    elapsedSec: api.elapsedSec,
    clinicalFeatures: api.clinicalFeatures,
    rawGifUrl: api.rawGifUrl ?? undefined,
    segGifUrl: api.segGifUrl ?? undefined,
    segGridEdUrl: api.segGridEdUrl ?? undefined,
    segGridEsUrl: api.segGridEsUrl ?? undefined,
  }
}

export function mlJsonToMriResult(json: Record<string, unknown>): MriMlResult {
  return {
    diagnosisClass: json.diagnosis_class as MriDiagnosisClass,
    elapsedSec: Number(json.elapsed_sec ?? 0),
    clinicalFeatures: json.clinical_features as MriClinicalFeatures,
    rawGifB64: String(json.raw_gif_b64 ?? ""),
    segGifB64: String(json.seg_gif_b64 ?? ""),
    segGridEdB64: String(json.seg_grid_ed_b64 ?? ""),
    segGridEsB64: String(json.seg_grid_es_b64 ?? ""),
  }
}
