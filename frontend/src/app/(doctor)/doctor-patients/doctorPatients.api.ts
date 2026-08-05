import { apiClient } from "@/lib/api-client"
import type {
  DiagnosisRecord,
  DoctorPatientsPagePatient,
  DoctorPatientsPageStats,
  FamilyHistoryEntry,
  PatientAllergyEntry,
  LabResult,
  MedicationRecord,
  PatientCareGoal,
  PatientClinicalNote,
  PatientFullRecord,
  UploadedDocument,
  VisitRecord,
  VitalReading,
} from "./doctorPatients.types"

type ApiListPatient = {
  id: string
  fullName: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  bloodType: string | null
  phone: string | null
  email: string | null
  address: string | null
  riskLevel: "low" | "moderate" | "high"
  bmi: number | null
  smokingStatus: string | null
  occupation: string | null
  maritalStatus: string | null
  nationalId: string | null
  avatarUrl: string | null
  patientSince: string
  activeMedications: number
  poorComplianceCount: number
  totalVisits: number
  lastVisitDate: string | null
  condition: string | null
  allergyCount: number
}

type ApiFullRecord = {
  patient: ApiListPatient & {
    allergies: Array<PatientAllergyEntry | string>
    familyHistory: Array<FamilyHistoryEntry | string>
    condition: string | null
    lastVisitDate: string | null
    upcomingAppointmentDate: string | null
  }
  latestVitals: Record<string, unknown> | null
  vitalReadings: Array<Record<string, unknown>>
  medications: Array<Record<string, unknown>>
  diagnoses: Array<Record<string, unknown>>
  labResults: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
  visits: Array<Record<string, unknown>>
  profileClinicalNotes?: Array<Record<string, unknown>>
  careGoals?: Array<Record<string, unknown>>
}

function mapAllergyEntry(raw: PatientAllergyEntry | string, index: number): PatientAllergyEntry {
  if (typeof raw === "object" && raw !== null && "allergen" in raw) {
    return {
      id: raw.id || `al-${index}`,
      category: raw.category ?? "other",
      allergen: raw.allergen,
      reaction: raw.reaction ?? "",
    }
  }

  const text = String(raw).trim()
  const parenMatch = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (parenMatch) {
    return {
      id: `al-${index}`,
      category: "drug",
      allergen: parenMatch[1]!.trim(),
      reaction: parenMatch[2]!.trim(),
    }
  }

  return {
    id: `al-${index}`,
    category: "other",
    allergen: text,
    reaction: "",
  }
}

function mapFamilyHistoryEntry(raw: FamilyHistoryEntry | string, index: number): FamilyHistoryEntry {
  if (typeof raw === "object" && raw !== null && "relationship" in raw) {
    return {
      id: raw.id || `fh-${index}`,
      relationship: raw.relationship,
      condition: raw.condition,
      details: raw.details ?? "",
    }
  }

  const text = String(raw)
  const separator = text.includes("—") ? "—" : text.includes(":") ? ":" : null
  if (separator) {
    const [relationship, ...rest] = text.split(separator).map((part) => part.trim())
    return {
      id: `fh-${index}`,
      relationship: relationship || "Other",
      condition: rest.join(separator === "—" ? " — " : ": ") || text,
      details: "",
    }
  }

  return {
    id: `fh-${index}`,
    relationship: "Other",
    condition: text,
    details: "",
  }
}

function mapAllergyCount(count: number): PatientAllergyEntry[] {
  if (count <= 0) return []
  return Array.from({ length: count }, (_, index) => ({
    id: `al-list-${index}`,
    category: "other" as const,
    allergen: "",
    reaction: "",
  }))
}

function mapListPatient(row: ApiListPatient): DoctorPatientsPagePatient {
  return {
    id: row.id,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    bloodType: row.bloodType ?? "—",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    condition: row.condition?.trim() ? row.condition : "—",
    activeMedications: row.activeMedications,
    poorComplianceCount: row.poorComplianceCount,
    lastVisitDate: row.lastVisitDate,
    upcomingAppointmentDate: null,
    riskLevel: row.riskLevel,
    allergies: mapAllergyCount(row.allergyCount ?? 0),
    familyHistory: [],
    smokingStatus: row.smokingStatus ?? "",
    bmi: row.bmi,
    totalVisits: row.totalVisits,
    patientSince: row.patientSince,
    profileImageUrl: row.avatarUrl,
    occupation: row.occupation ?? "",
    maritalStatus: row.maritalStatus ?? "",
    nationalId: row.nationalId ?? "",
  }
}

function mapPatientFromFull(
  row: ApiFullRecord["patient"],
): DoctorPatientsPagePatient {
  return {
    ...mapListPatient(row),
    condition: row.condition ?? "—",
    allergies: (row.allergies ?? []).map(mapAllergyEntry),
    familyHistory: (row.familyHistory ?? []).map(mapFamilyHistoryEntry),
    lastVisitDate: row.lastVisitDate,
    upcomingAppointmentDate: row.upcomingAppointmentDate,
  }
}

function mapVitalReading(row: Record<string, unknown>): VitalReading {
  const createdAt = String(row.createdAt ?? row.date ?? "")
  const date = createdAt ? new Date(createdAt) : new Date()
  return {
    id: String(row.id ?? ""),
    date: date.toISOString().slice(0, 10),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    source: (row.source as VitalReading["source"]) ?? "clinic",
    systolicBP: row.systolicBP != null ? Number(row.systolicBP) : null,
    diastolicBP: row.diastolicBP != null ? Number(row.diastolicBP) : null,
    heartRate: row.heartRate != null ? Number(row.heartRate) : null,
    oxygenSaturation: row.oxygenSaturation != null ? Number(row.oxygenSaturation) : null,
    temperature: row.temperature != null ? Number(row.temperature) : null,
    weight: row.weight != null ? Number(row.weight) : null,
    bloodSugar: row.bloodSugar != null ? Number(row.bloodSugar) : null,
    notes: String(row.notes ?? ""),
  }
}

function mapMedication(row: Record<string, unknown>): MedicationRecord {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    dose: String(row.dose ?? ""),
    frequency: String(row.frequency ?? ""),
    type: (row.type as MedicationRecord["type"]) ?? "other",
    status: (row.status as MedicationRecord["status"]) ?? "active",
    compliance: (row.compliance as MedicationRecord["compliance"]) ?? null,
    timeOfDay: (row.timeOfDay as MedicationRecord["timeOfDay"]) ?? undefined,
    instructions: row.instructions != null ? String(row.instructions) : null,
    startDate: row.startDate != null ? String(row.startDate) : undefined,
    durationDays: row.durationDays != null ? Number(row.durationDays) : null,
    prescribedAt: String(row.prescribedAt ?? row.createdAt ?? ""),
    prescribedBy: String(row.prescribedBy ?? "Doctor"),
    lastTakenAt: row.lastTakenAt != null ? String(row.lastTakenAt) : null,
    adherencePercent:
      row.adherencePercent != null ? Number(row.adherencePercent) : 0,
    sideEffects: row.sideEffects != null ? String(row.sideEffects) : null,
  }
}

function mapDiagnosis(row: Record<string, unknown>): DiagnosisRecord {
  return {
    id: String(row.id ?? ""),
    icdCode: String(row.icdCode ?? ""),
    description: String(row.description ?? ""),
    category: (row.category as DiagnosisRecord["category"]) ?? "other",
    chronicFlag: Boolean(row.chronicFlag ?? row.chronic_flag ?? false),
    infectiousFlag: Boolean(row.infectiousFlag ?? row.infectious_flag ?? false),
    type: (row.type as DiagnosisRecord["type"]) ?? "primary",
    severity: (row.severity as DiagnosisRecord["severity"]) ?? "moderate",
    diagnosedAt: String(row.diagnosedAt ?? row.createdAt ?? ""),
    diagnosedBy: String(row.diagnosedBy ?? "Doctor"),
    status: (row.status as DiagnosisRecord["status"]) ?? "active",
    notes: String(row.notes ?? row.clinicalNotes ?? ""),
    createdAt: String(row.createdAt ?? row.created_at ?? row.diagnosedAt ?? ""),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.diagnosedAt ?? ""),
  }
}

function mapLabResult(row: Record<string, unknown>, index: number): LabResult {
  const documentId = row.documentId ? String(row.documentId) : undefined
  const date = String(row.resultAt ?? row.date ?? "")
  const panelId = String(row.panelId ?? documentId ?? (date ? `${date}-${index}` : `panel-${index}`))

  return {
    id: String(row.id ?? ""),
    panelId,
    testName: String(row.testName ?? ""),
    value: String(row.value ?? ""),
    unit: String(row.unit ?? ""),
    referenceRange: String(row.referenceRange ?? ""),
    status: (row.status as LabResult["status"]) ?? "normal",
    date,
    orderedBy: String(row.orderedBy ?? "Doctor"),
    source: (row.source as LabResult["source"]) ?? (documentId ? "upload" : "manual"),
    documentId,
    panelTitle: row.panelTitle ? String(row.panelTitle) : undefined,
  }
}

function mapDocument(row: Record<string, unknown>): UploadedDocument {
  return {
    id: String(row.id ?? ""),
    fileName: String(row.fileName ?? "Unnamed"),
    type: (row.type as UploadedDocument["type"]) ?? "other",
    uploadedAt: String(row.uploadedAt ?? ""),
    uploadedBy: String(row.uploadedBy ?? "System"),
    fileSize: String(row.fileSize ?? "—"),
  }
}

function mapVisit(row: Record<string, unknown>): VisitRecord {
  return {
    id: String(row.id ?? ""),
    date: String(row.date ?? ""),
    type: (row.type as VisitRecord["type"]) ?? "follow-up",
    doctorName: String(row.doctorName ?? "Doctor"),
    chiefComplaint: String(row.chiefComplaint ?? ""),
    diagnosisSummary: String(row.diagnosisSummary ?? ""),
    notes: String(row.notes ?? ""),
    durationMin: Number(row.durationMin ?? 0),
  }
}

function mapProfileClinicalNote(row: Record<string, unknown>): PatientClinicalNote {
  return {
    id: String(row.id ?? ""),
    date: String(row.date ?? ""),
    text: String(row.text ?? row.body ?? ""),
    author: String(row.author ?? "Doctor"),
  }
}

function mapCareGoal(row: Record<string, unknown>): PatientCareGoal {
  return {
    id: String(row.id ?? ""),
    metric: String(row.metric ?? ""),
    target: String(row.target ?? ""),
    current: row.current != null ? String(row.current) : undefined,
    status: (row.status as PatientCareGoal["status"]) ?? "on-track",
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  }
}

export async function fetchDoctorPatients(): Promise<DoctorPatientsPagePatient[]> {
  const { data } = await apiClient.get<ApiListPatient[]>("/doctor/patients")
  return data.map(mapListPatient)
}

export async function fetchDoctorPatientStats(): Promise<DoctorPatientsPageStats> {
  const { data } = await apiClient.get<DoctorPatientsPageStats>("/doctor/patients/stats")
  return data
}

export async function fetchDoctorPatientRecord(patientId: string): Promise<PatientFullRecord> {
  const { data } = await apiClient.get<ApiFullRecord>(`/doctor/patients/${patientId}`)
  return mapFullRecord(data)
}

function mapFullRecord(data: ApiFullRecord): PatientFullRecord {
  const latest = data.latestVitals ? mapVitalReading(data.latestVitals) : null
  return {
    patient: mapPatientFromFull(data.patient),
    latestVitals: latest,
    vitalReadings: data.vitalReadings.map(mapVitalReading),
    medications: data.medications.map(mapMedication),
    diagnoses: data.diagnoses.map(mapDiagnosis),
    labResults: data.labResults.map(mapLabResult),
    documents: data.documents.map(mapDocument),
    visits: data.visits.map(mapVisit),
    profileClinicalNotes: (data.profileClinicalNotes ?? []).map(mapProfileClinicalNote),
    careGoals: (data.careGoals ?? []).map(mapCareGoal),
  }
}

export type UpdateDoctorPatientProfilePayload = {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  avatarUrl?: string
  gender?: "male" | "female" | "other"
  bloodType?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | null
  maritalStatus?: "single" | "married" | "divorced" | "widowed" | null
  occupation?: string
  nationalId?: string
  smokingStatus?:
    | "never"
    | "former-5"
    | "former-10"
    | "former-15"
    | "former-20"
    | "current-5"
    | "current-10"
    | "current-15"
    | "current-20"
    | null
}

export async function updateDoctorPatientProfile(
  patientId: string,
  payload: UpdateDoctorPatientProfilePayload,
): Promise<PatientFullRecord> {
  const { data } = await apiClient.patch<ApiFullRecord>(
    `/doctor/patients/${patientId}`,
    payload,
  )
  return mapFullRecord(data)
}

export type CreatePatientClinicalNotePayload = {
  body: string
}

export type CreatePatientCareGoalPayload = {
  metric: string
  target: string
  current?: string
  status?: PatientCareGoal["status"]
}

export type UpdatePatientCareGoalPayload = {
  metric?: string
  target?: string
  current?: string | null
  status?: PatientCareGoal["status"]
}

export async function createPatientClinicalNote(
  patientId: string,
  payload: CreatePatientClinicalNotePayload,
): Promise<PatientClinicalNote> {
  const { data } = await apiClient.post<PatientClinicalNote>(
    `/doctor/patients/${patientId}/clinical-notes`,
    payload,
  )
  return mapProfileClinicalNote(data as Record<string, unknown>)
}

export async function deletePatientClinicalNote(
  patientId: string,
  noteId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/clinical-notes/${noteId}`)
}

export async function createPatientCareGoal(
  patientId: string,
  payload: CreatePatientCareGoalPayload,
): Promise<PatientCareGoal> {
  const { data } = await apiClient.post<PatientCareGoal>(
    `/doctor/patients/${patientId}/care-goals`,
    payload,
  )
  return mapCareGoal(data as Record<string, unknown>)
}

export async function updatePatientCareGoal(
  patientId: string,
  goalId: string,
  payload: UpdatePatientCareGoalPayload,
): Promise<PatientCareGoal> {
  const { data } = await apiClient.patch<PatientCareGoal>(
    `/doctor/patients/${patientId}/care-goals/${goalId}`,
    payload,
  )
  return mapCareGoal(data as Record<string, unknown>)
}

export async function deletePatientCareGoal(
  patientId: string,
  goalId: string,
): Promise<void> {
  await apiClient.delete(`/doctor/patients/${patientId}/care-goals/${goalId}`)
}
