import { apiClient } from "@/lib/api-client"
import type { LabAnalysisBundle } from "@/app/(doctor)/doctor-queue/[queueEntryId]/consultation/labMaterials.types"
import type { PatientLabOrder } from "./labOrders.types"

type PatientLabOrderApiRow = {
  id: string
  title: string
  tests: string[]
  orderedAt: string
  dueAt: string
  doctorName: string
  status: PatientLabOrder["status"]
  notes?: string
  priority: PatientLabOrder["priority"]
}

export async function fetchPatientLabOrders(): Promise<PatientLabOrder[]> {
  const { data } = await apiClient.get<PatientLabOrderApiRow[]>("/patient/lab-orders")
  return data
}

async function uploadLabFileToStorage(
  orderId: string,
  file: File,
): Promise<string> {
  const contentType = file.type || "application/octet-stream"
  const { data: intent } = await apiClient.post<{
    key: string
    uploadUrl: string
  }>(`/patient/lab-orders/${orderId}/upload-intent`, {
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

export async function uploadPatientLabReport(params: {
  orderId: string
  file: File
  analysis: LabAnalysisBundle
  panelTitle?: string
}): Promise<void> {
  const s3Key = await uploadLabFileToStorage(params.orderId, params.file)
  const contentType = params.file.type || "application/octet-stream"

  const { data: document } = await apiClient.post<{ id: string }>(
    `/patient/lab-orders/${params.orderId}/documents`,
    {
      fileName: params.file.name,
      contentType,
      s3Key,
      fileSize: params.file.size,
    },
  )

  await apiClient.post(`/patient/lab-orders/${params.orderId}/report`, {
    documentId: document.id,
    panelTitle: params.panelTitle,
    analysis: params.analysis,
  })
}
