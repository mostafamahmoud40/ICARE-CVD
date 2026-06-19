import { apiClient } from "@/lib/api-client"
import type {
  ApiConsultationReport,
  ApiPatientConsultationListItem,
} from "@/lib/consultation-report.mapper"
import {
  mapApiListItemToVisitSummary,
  mapApiReportToVisitSummary,
} from "@/lib/consultation-report.mapper"
import type { VisitSummary } from "./consultations.types"
import { sortVisitsByScheduledAtDesc } from "./consultations.utils"

export async function fetchPatientConsultations(): Promise<VisitSummary[]> {
  const { data } = await apiClient.get<ApiPatientConsultationListItem[]>(
    "/patient/consultations",
  )
  return sortVisitsByScheduledAtDesc(data.map(mapApiListItemToVisitSummary))
}

export async function fetchPatientConsultation(
  consultationId: string,
): Promise<VisitSummary> {
  const { data } = await apiClient.get<ApiConsultationReport>(
    `/patient/consultations/${consultationId}`,
  )
  return mapApiReportToVisitSummary(data, [])
}
