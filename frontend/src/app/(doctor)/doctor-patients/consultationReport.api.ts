import { apiClient } from "@/lib/api-client"
import type { ApiConsultationReport } from "@/lib/consultation-report.mapper"
import { mapApiReportToDoctorReport } from "@/lib/consultation-report.mapper"
import type { ConsultationReport } from "./doctorPatients.types"
import type { ConsultationFieldPatch } from "../doctor-queue/[queueEntryId]/consultation/consultation.api"

export async function fetchConsultationReport(
  patientId: string,
  consultationId: string,
): Promise<ConsultationReport> {
  const { data } = await apiClient.get<ApiConsultationReport>(
    `/doctor/patients/${patientId}/consultations/${consultationId}`,
  )
  return mapApiReportToDoctorReport(data)
}

export async function updateConsultationReport(
  patientId: string,
  consultationId: string,
  patch: ConsultationFieldPatch & { reportOverrides?: string },
): Promise<void> {
  await apiClient.patch(
    `/doctor/patients/${patientId}/consultations/${consultationId}`,
    patch,
  )
}

export async function deleteConsultationReport(
  patientId: string,
  consultationId: string,
): Promise<void> {
  await apiClient.delete(
    `/doctor/patients/${patientId}/consultations/${consultationId}`,
  )
}

