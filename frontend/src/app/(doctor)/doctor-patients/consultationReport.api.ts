import { apiClient } from "@/lib/api-client"
import type { ApiConsultationReport } from "@/lib/consultation-report.mapper"
import { mapApiReportToDoctorReport } from "@/lib/consultation-report.mapper"
import type { ConsultationReport } from "./doctorPatients.types"

export async function fetchConsultationReport(
  patientId: string,
  consultationId: string,
): Promise<ConsultationReport> {
  const { data } = await apiClient.get<ApiConsultationReport>(
    `/doctor/patients/${patientId}/consultations/${consultationId}`,
  )
  return mapApiReportToDoctorReport(data)
}
