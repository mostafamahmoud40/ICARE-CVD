import { apiClient } from "@/lib/api-client"

export type AssistantPatientRecordResponse = {
  patient: {
    internalId: string
    id: string
    userId: number
    fullName: string
    dateOfBirth: string | null
    gender: "male" | "female" | "other" | null
    bloodType: string | null
    phone: string | null
    email: string | null
    address: string | null
    riskLevel: "low" | "moderate" | "high" | null
    bmi: number | null
    heightCm: number | null
    weightKg: number | null
    smokingStatus: string | null
    alcoholConsumption: string | null
    exerciseFrequency: string | null
    stressLevel: string | null
    dietaryHabits: string | null
    occupation: string | null
    maritalStatus: string | null
    nationalId: string | null
    avatarUrl: string | null
    patientSince: string | null
    chiefComplaint: string | null
    allergies: Array<{
      id: string
      category: string
      allergen: string
      reaction: string | null
    }>
    familyHistory: Array<{
      id: string
      relationship: string
      condition: string
      details: string | null
    }>
    activeMedications: number
    condition: string | null
    lastVisitDate: string | null
    upcomingAppointmentDate: string | null
  }
  latestVitals: Record<string, unknown> | null
  vitalReadings: Array<Record<string, unknown>>
  medications: Array<Record<string, unknown>>
  diagnoses: Array<Record<string, unknown>>
  labResults: Array<Record<string, unknown>>
  documents: Array<{
    id: string
    fileName: string
    title: string | null
    category: string
    uploadedAt: string | null
    fileSize: string | null
  }>
  visits: Array<{
    id: string
    date: string | null
    type: string
    doctorName: string
    department: string
    chiefComplaint: string
    notes: string
    status: string
    durationMin: number
  }>
}

export type AssistantAppointmentApiRow = {
  id: string
  patientId: string
  patientName: string
  doctorName: string
  department: string
  scheduledAt: string
  visitType: string
  reason: string | null
  notes: string | null
  status: string
}

export async function fetchAssistantPatientRecord(
  patientId: string,
): Promise<AssistantPatientRecordResponse> {
  const { data } = await apiClient.get<AssistantPatientRecordResponse>(
    `/assistant/patients/${encodeURIComponent(patientId)}`,
  )
  return data
}

export async function fetchAssistantAppointments(): Promise<AssistantAppointmentApiRow[]> {
  const { data } = await apiClient.get<AssistantAppointmentApiRow[]>("/assistant/appointments")
  return data
}
