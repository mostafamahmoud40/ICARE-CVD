import { apiClient } from "@/lib/api-client"
import type {
  Allergy,
  ChiefComplaintStructured,
  ConsultationMedicalHistory,
  DiagnosisEntry,
  HomeMeasurement,
  PhysicalExamFindings,
  PrescriptionEntry,
  ProcedureDetails,
  TestOrder,
} from "./consultation.types"

export type ApiConsultationSession = {
  consultation: {
    id: string
    appointmentId: string | null
    chiefComplaint: string | null
    historyOfPresentIllness: string | null
    chiefComplaintStructured: string | null
    physicalExam: string | null
    notes: string | null
    plan: string | null
    followUpTimeframe: string | null
    followUpInstructions: string | null
    homeMonitoring: string | null
    consultationMedicalHistory: string | null
    consultationProcedureDetails: string | null
    patientDiagnosisSummary: string | null
    patientLifestyleAdvice: string | null
    patientDangerSigns: string | null
  }
  diagnoses: Array<{
    id: string
    icdCode: string
    description: string
    type: DiagnosisEntry["type"]
    severity: DiagnosisEntry["severity"]
    notes: string | null
  }>
  labOrders: Array<{
    id: string
    priority: TestOrder["urgency"]
    notes: string | null
    items: Array<{
      id: string
      testName: string
      panel: string | null
    }>
  }>
  prescriptions: Array<{
    id: string
    medicationId: string
    name: string
    dose: string
    frequency: string
    type: string
    instructions: string | null
    duration: string | null
    notes: string | null
    durationDays: number | null
  }>
  patientHistory: {
    noCardiacHistory: boolean
    pastCardiacHistory: Record<string, string> | null
    noNonCardiacHistory: boolean
    pastNonCardiacHistory: Record<string, string> | null
    medicalHistoryNotes: string | null
  } | null
}

export type ConsultationFieldPatch = {
  chiefComplaint?: string
  historyOfPresentIllness?: string
  chiefComplaintStructured?: string
  physicalExam?: string
  notes?: string
  plan?: string
  followUpTimeframe?: string
  followUpInstructions?: string
  homeMonitoring?: string
  consultationMedicalHistory?: string
  consultationProcedureDetails?: string
  patientDiagnosisSummary?: string
  patientLifestyleAdvice?: string
  patientDangerSigns?: string
  status?: "in-progress" | "completed" | "cancelled"
  durationMinutes?: number
  reportOverrides?: string
}

export async function fetchConsultationSession(
  queueEntryId: string,
): Promise<ApiConsultationSession> {
  const { data } = await apiClient.get<ApiConsultationSession>(
    `/doctor/queue/${queueEntryId}/consultation-session`,
  )
  return data
}

export async function patchConsultation(
  patientId: string,
  consultationId: string,
  patch: ConsultationFieldPatch,
): Promise<void> {
  await apiClient.patch(
    `/doctor/patients/${patientId}/consultations/${consultationId}`,
    patch,
  )
}

export async function completeConsultationSession(
  patientId: string,
  consultationId: string,
  durationMinutes?: number,
): Promise<void> {
  await patchConsultation(patientId, consultationId, {
    status: "completed",
    ...(durationMinutes != null ? { durationMinutes } : {}),
  })
}

export async function completeQueueEntry(queueEntryId: string): Promise<void> {
  await apiClient.patch(`/doctor/queue/${queueEntryId}/status`, {
    status: "completed",
  })
}

export async function createPatientDiagnosis(
  patientId: string,
  payload: {
    icdCode: string
    description: string
    type: DiagnosisEntry["type"]
    severity: DiagnosisEntry["severity"]
    clinicalNotes?: string
    status?: "active" | "resolved" | "chronic"
  },
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/patients/${patientId}/diagnoses`,
    {
      ...payload,
      confirmation: "presumed",
    },
  )
  return data
}

export async function linkConsultationDiagnosis(
  patientId: string,
  consultationId: string,
  payload: {
    diagnosisId: string
    type: DiagnosisEntry["type"]
    notes?: string
  },
): Promise<void> {
  await apiClient.post(
    `/doctor/patients/${patientId}/consultations/${consultationId}/diagnoses`,
    payload,
  )
}

export async function deletePatientDiagnosis(
  patientId: string,
  diagnosisId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/diagnoses/${diagnosisId}`)
}

export async function updatePatientDiagnosis(
  patientId: string,
  diagnosisId: string,
  payload: {
    icdCode?: string
    description?: string
    type?: DiagnosisEntry["type"]
    severity?: DiagnosisEntry["severity"]
    clinicalNotes?: string
  },
): Promise<void> {
  await apiClient.patch(
    `/doctor/patients/${patientId}/diagnoses/${diagnosisId}`,
    payload,
  )
}

export async function createLabOrder(
  patientId: string,
  payload: {
    appointmentId: string
    priority: TestOrder["urgency"]
    notes: string
    items: Array<{ testName: string; panel?: string }>
  },
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/patients/${patientId}/lab-orders`,
    payload,
  )
  return data
}

export async function cancelLabOrder(
  patientId: string,
  orderId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/lab-orders/${orderId}/cancel`)
}

export async function createMedication(
  patientId: string,
  payload: {
    name: string
    dose: string
    frequency: string
    type: string
    instructions?: string
    durationDays?: number | null
  },
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>(
    `/doctor/medications/patients/${patientId}`,
    payload,
  )
  return data
}

export async function deleteMedication(medicationId: string): Promise<void> {
  await apiClient.delete(`/doctor/medications/${medicationId}`)
}

export async function updateMedication(
  medicationId: string,
  payload: {
    name?: string
    dose?: string
    frequency?: string
    type?: string
    instructions?: string
    durationDays?: number | null
  },
): Promise<void> {
  await apiClient.patch(`/doctor/medications/${medicationId}`, payload)
}

export async function updateConsultationPrescriptionLink(
  patientId: string,
  consultationId: string,
  medicationId: string,
  payload: {
    duration?: string
    notes?: string
  },
): Promise<void> {
  await apiClient.patch(
    `/doctor/patients/${patientId}/consultations/${consultationId}/prescriptions/${medicationId}`,
    payload,
  )
}

export async function linkConsultationPrescription(
  patientId: string,
  consultationId: string,
  payload: {
    medicationId: string
    duration?: string
    notes?: string
  },
): Promise<void> {
  await apiClient.post(
    `/doctor/patients/${patientId}/consultations/${consultationId}/prescriptions`,
    payload,
  )
}

export async function createPatientAllergy(
  patientId: string,
  payload: Pick<Allergy, "category" | "allergen" | "reaction">,
): Promise<Allergy> {
  const { data } = await apiClient.post<Allergy>(
    `/doctor/patients/${patientId}/allergies`,
    payload,
  )
  return data
}

export async function deletePatientAllergy(
  patientId: string,
  allergyId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/allergies/${allergyId}`)
}

export function buildConsultationFieldPatch(input: {
  chiefComplaint: string
  chiefComplaintStructured: ChiefComplaintStructured
  physicalExam: PhysicalExamFindings
  clinicalNotes: string
  assessmentAndPlan: string
  followUpDate: string
  followUpNotes: string
  homeMeasurements: HomeMeasurement[]
  medicalHistory: ConsultationMedicalHistory
  procedureDetails: ProcedureDetails
  patientDiagnosisSummary: string
  patientLifestyleAdvice: string
  patientDangerSigns: string
}): ConsultationFieldPatch {
  return {
    chiefComplaint: input.chiefComplaint,
    historyOfPresentIllness: input.chiefComplaintStructured.primaryComplaint,
    chiefComplaintStructured: JSON.stringify(input.chiefComplaintStructured),
    physicalExam: JSON.stringify(input.physicalExam),
    notes: input.clinicalNotes,
    plan: input.assessmentAndPlan,
    followUpTimeframe: input.followUpDate,
    followUpInstructions: input.followUpNotes,
    homeMonitoring: JSON.stringify(input.homeMeasurements),
    consultationMedicalHistory: JSON.stringify(input.medicalHistory),
    consultationProcedureDetails: JSON.stringify(input.procedureDetails),
    patientDiagnosisSummary: input.patientDiagnosisSummary,
    patientLifestyleAdvice: input.patientLifestyleAdvice,
    patientDangerSigns: input.patientDangerSigns,
  }
}
