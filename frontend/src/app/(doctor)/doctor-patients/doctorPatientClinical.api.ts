import { apiClient } from "@/lib/api-client"
import type { DiagnosisFormValues } from "./[patientId]/diagnoses/diagnosisForm.types"
import type { DiagnosisRecord, MedicationRecord } from "./doctorPatients.types"

export type DiagnosisApiPayload = {
  icdCode: string
  description: string
  category?: DiagnosisRecord["category"]
  chronicFlag?: boolean
  infectiousFlag?: boolean
  type: DiagnosisRecord["type"]
  severity: DiagnosisRecord["severity"]
  confirmation: "confirmed" | "unconfirmed" | "presumed"
  onsetDate?: string
  status?: DiagnosisRecord["status"]
  laterality?: "unspecified" | "left" | "right" | "bilateral" | "other"
  nyhaClass?: string
  clinicalNotes?: string
}

export function diagnosisFormToApiPayload(data: DiagnosisFormValues): DiagnosisApiPayload {
  return {
    icdCode: data.icdCode.trim() || "N/A",
    description: data.description.trim(),
    category: data.category,
    chronicFlag: data.chronicFlag,
    infectiousFlag: data.infectiousFlag,
    type: data.type,
    severity: data.severity,
    confirmation: data.confirmation,
    onsetDate: data.onsetDate || undefined,
    status: data.status,
    laterality: data.laterality,
    nyhaClass: data.nyhaClass || undefined,
    clinicalNotes: data.clinicalNotes.trim() || undefined,
  }
}

export async function createDoctorPatientDiagnosis(
  patientId: string,
  payload: DiagnosisApiPayload,
) {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/patients/${patientId}/diagnoses`,
    payload,
  )
  return data
}

export async function updateDoctorPatientDiagnosis(
  patientId: string,
  diagnosisId: string,
  payload: Partial<DiagnosisApiPayload>,
) {
  await apiClient.patch(`/doctor/patients/${patientId}/diagnoses/${diagnosisId}`, payload)
}

export async function deleteDoctorPatientDiagnosis(patientId: string, diagnosisId: string) {
  await apiClient.delete(`/doctor/patients/${patientId}/diagnoses/${diagnosisId}`)
}

export type DoctorMedicationWritePayload = {
  name: string
  dose: string
  frequency: string
  type: string
  sideEffects?: string
  instructions?: string
  timeOfDay?: Array<"morning" | "afternoon" | "evening">
  durationDays?: number | null
  startDate?: string
  compliance?: "good" | "poor"
}

export async function createDoctorPatientMedication(
  patientId: string,
  payload: DoctorMedicationWritePayload,
) {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/medications/patients/${patientId}`,
    {
      ...payload,
      startDate: payload.startDate ?? new Date().toISOString().split("T")[0],
    },
  )
  return data
}

export async function updateDoctorPatientMedication(
  medicationId: string,
  payload: Partial<DoctorMedicationWritePayload>,
) {
  await apiClient.patch(`/doctor/medications/${medicationId}`, payload)
}

export async function changeDoctorPatientMedicationStatus(
  medicationId: string,
  status: MedicationRecord["status"],
) {
  await apiClient.patch(`/doctor/medications/${medicationId}/status`, { status })
}

export type MedicationAdherenceRecord = {
  medication: {
    id: string
    name: string
    dose: string
    frequency: string
    type: string
    status: MedicationRecord["status"]
    instructions: string | null
    sideEffects: string | null
    timeOfDay: Array<"morning" | "afternoon" | "evening">
    adherencePercent: number
  }
  doseLogs: Array<{
    id: string
    takenAt: string
    skipped: boolean
  }>
}

export async function fetchDoctorMedicationAdherenceRecord(
  medicationId: string,
): Promise<MedicationAdherenceRecord> {
  const { data } = await apiClient.get<MedicationAdherenceRecord>(
    `/doctor/medications/${medicationId}/adherence-record`,
  )
  return data
}
