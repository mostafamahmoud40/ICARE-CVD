import { apiClient } from "@/lib/api-client"
import type {
  DiagnosisRecord,
  DoctorPatientsPagePatient,
  DoctorPatientsPageStats,
  LabResult,
  MedicationRecord,
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
}

type ApiFullRecord = {
  patient: ApiListPatient & {
    allergies: string[]
    familyHistory: string[]
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
    condition: "—",
    activeMedications: row.activeMedications,
    poorComplianceCount: row.poorComplianceCount,
    lastVisitDate: null,
    upcomingAppointmentDate: null,
    riskLevel: row.riskLevel,
    allergies: [],
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
    allergies: row.allergies ?? [],
    familyHistory: row.familyHistory ?? [],
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
      row.adherencePercent != null ? Number(row.adherencePercent) : undefined,
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

function mapLabResult(row: Record<string, unknown>): LabResult {
  return {
    id: String(row.id ?? ""),
    testName: String(row.testName ?? ""),
    value: String(row.value ?? ""),
    unit: String(row.unit ?? ""),
    referenceRange: String(row.referenceRange ?? ""),
    status: (row.status as LabResult["status"]) ?? "normal",
    date: String(row.resultAt ?? row.date ?? ""),
    orderedBy: String(row.orderedBy ?? "Doctor"),
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
  const latest = data.latestVitals ? mapVitalReading(data.latestVitals) : null
  return {
    patient: mapPatientFromFull(data.patient),
    latestVitals: latest
      ? {
          systolicBP: latest.systolicBP ?? 0,
          diastolicBP: latest.diastolicBP ?? 0,
          heartRate: latest.heartRate ?? 0,
          oxygenSaturation: latest.oxygenSaturation ?? 0,
          temperature: latest.temperature ?? 0,
          weight: latest.weight ?? 0,
          bloodSugar: latest.bloodSugar,
        }
      : null,
    vitalReadings: data.vitalReadings.map(mapVitalReading),
    medications: data.medications.map(mapMedication),
    diagnoses: data.diagnoses.map(mapDiagnosis),
    labResults: data.labResults.map(mapLabResult),
    documents: data.documents.map(mapDocument),
    visits: data.visits.map(mapVisit),
  }
}
