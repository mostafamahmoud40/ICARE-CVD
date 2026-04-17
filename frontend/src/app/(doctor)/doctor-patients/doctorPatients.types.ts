export type DoctorPatientsPagePatient = {
  id: string
  fullName: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  bloodType: string
  phone: string
  email: string
  address: string
  condition: string
  activeMedications: number
  poorComplianceCount: number
  lastVisitDate: string | null
  upcomingAppointmentDate: string | null
  riskLevel: "low" | "moderate" | "high"
  allergies: string[]
  familyHistory: string[]
  smokingStatus: string
  bmi: number | null
  totalVisits: number
  patientSince: string
  profileImageUrl: string | null
  occupation: string
  maritalStatus: string
  nationalId: string
}

export type DoctorPatientsPageStats = {
  totalPatients: number
  highRiskCount: number
  complianceAlertsCount: number
}

export type DoctorPatientsPageData = {
  patients: DoctorPatientsPagePatient[]
  stats: DoctorPatientsPageStats
}

export type VitalReading = {
  id: string
  date: string
  time: string
  source: "home" | "clinic" | "hospital"
  systolicBP: number | null
  diastolicBP: number | null
  heartRate: number | null
  oxygenSaturation: number | null
  temperature: number | null
  weight: number | null
  bloodSugar: number | null
  notes: string
}

export type MedicationRecord = {
  id: string
  name: string
  dose: string
  frequency: string
  /** Mirrors backend `medication.type` enum (stored as text). */
  type:
    | "antihypertensives"
    | "antiplatelets"
    | "anticoagulants"
    | "statins"
    | "antiarrhythmics"
    | "diuretics"
    | "diabetes_medications"
    | "other"
  /** Mirrors backend `medication.status` enum. */
  status: "active" | "paused" | "discontinued"
  /** Mirrors backend `medication.compliance` enum (optional). */
  compliance?: "good" | "poor" | null
  /** Mirrors backend `medication.time_of_day` enum array (optional). */
  timeOfDay?: Array<"morning" | "afternoon" | "evening">
  /** Mirrors backend `medication.instructions` (optional). */
  instructions?: string | null
  /** Mirrors backend `medication.start_date` (optional in UI mock). */
  startDate?: string
  /** Mirrors backend `medication.duration_days` (optional). */
  durationDays?: number | null
  /** Mirrors backend computed `end_date` (optional). */
  endDate?: string | null
  /** Mirrors backend `paused_at` / `discontinued_at` (optional). */
  pausedAt?: string | null
  discontinuedAt?: string | null
  /** Legacy/mock fields used by current UI cards. */
  prescribedAt: string
  prescribedBy: string
  adherencePercent: number
  sideEffects: string | null
  lastTakenAt: string | null
}

export type DiagnosisRecord = {
  id: string
  icdCode: string
  description: string
  type: "primary" | "secondary" | "differential"
  severity: "mild" | "moderate" | "severe" | "critical"
  diagnosedAt: string
  diagnosedBy: string
  status: "active" | "resolved" | "chronic"
  notes: string
}

export type LabResult = {
  id: string
  testName: string
  value: string
  unit: string
  referenceRange: string
  status: "normal" | "high" | "low" | "critical"
  date: string
  orderedBy: string
}

export type UploadedDocument = {
  id: string
  fileName: string
  type: "lab_report" | "imaging" | "ecg" | "prescription" | "referral" | "other"
  uploadedAt: string
  uploadedBy: string
  fileSize: string
}

export type VisitRecord = {
  id: string
  date: string
  type: "follow-up" | "new" | "walk-in" | "post-procedure" | "urgent"
  doctorName: string
  chiefComplaint: string
  diagnosisSummary: string
  notes: string
  durationMin: number
}

export type ConsultationVitals = {
  systolicBP: number
  diastolicBP: number
  heartRate: number
  oxygenSaturation: number
  temperature: number
  weight: number
  bloodSugar: number | null
}

export type ConsultationPrescription = {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  isNew: boolean
}

export type Referral = {
  specialty: string
  reason: string
  urgency: "routine" | "urgent"
}

export type ConsultationReport = {
  visitId: string
  patientId: string
  date: string
  time: string
  doctorName: string
  doctorSpecialty: string
  type: VisitRecord["type"]
  durationMin: number
  chiefComplaint: string
  historyOfPresentIllness: string
  vitals: ConsultationVitals | null
  physicalExam: string
  diagnoses: { icdCode: string; description: string; type: "primary" | "secondary" }[]
  prescriptions: ConsultationPrescription[]
  labOrders: string[]
  referrals: Referral[]
  plan: string
  followUp: { timeframe: string; instructions: string }
  notes: string
}

export type PatientFullRecord = {
  patient: DoctorPatientsPagePatient
  latestVitals: VitalReading | null
  vitalReadings: VitalReading[]
  medications: MedicationRecord[]
  diagnoses: DiagnosisRecord[]
  labResults: LabResult[]
  documents: UploadedDocument[]
  visits: VisitRecord[]
}
