export type PatientDemographics = {
  fullName: string
  age: number
  gender: "male" | "female" | "other"
  bloodType: string
  dateOfBirth: string
  nationalId: string
  phone: string
  email: string
  address: string
  occupation: string
  maritalStatus: string
  avatarUrl: string | null
}

export type Allergy = {
  id: string
  category: "drug" | "food" | "other"
  allergen: string
  reaction: string
}

export type ActiveMedication = {
  id: string
  name: string
  dose: string
  frequency: string
  status: "active" | "paused"
}

export type FamilyHistoryItem = {
  id: string
  relationship: string
  condition: string
  details: string
}

export type LifestyleFlag = {
  label: string
  value: string
  riskLevel: "low" | "moderate" | "high"
}

export type ExistingCondition = {
  id: string
  name: string
  details: string
  diagnosedAt: string
}

export type PatientSummary = {
  demographics: PatientDemographics
  allergies: Allergy[]
  activeMedications: ActiveMedication[]
  familyHistory: FamilyHistoryItem[]
  lifestyleFlags: LifestyleFlag[]
  existingConditions: ExistingCondition[]
}

export type VitalReadingSource = "home" | "clinic" | "hospital"

export type ConsultationVitalReading = {
  id: string
  date: string
  time: string
  source: VitalReadingSource
  systolicBP: number | null
  diastolicBP: number | null
  heartRate: number | null
  oxygenSaturation: number | null
  temperature: number | null
  respiratoryRate: number | null
  weight: number | null
  heightCm: number | null
  bloodSugar: number | null
  notes: string
}

export type VitalSigns = {
  systolicBP: string
  diastolicBP: string
  heartRate: string
  temperature: string
  respiratoryRate: string
  oxygenSaturation: string
  heightCm: string
  weightKg: string
}

export type PhysicalExamFindings = {
  heartSounds: string
  murmurs: string
  jvp: string
  peripheralEdema: string
  lungAuscultation: string
  additionalFindings: string
}

export type DiagnosisEntry = {
  id: string
  icdCode: string
  description: string
  type: "primary" | "secondary" | "differential"
  severity: "mild" | "moderate" | "severe" | "critical"
  notes: string
  isAiSuggested: boolean
}

export type PrescriptionEntry = {
  id: string
  name: string
  dose: string
  frequency: string
  duration: string
  type: string
  instructions: string
}

export type AISuggestion = {
  id: string
  type: "diagnosis" | "prescription" | "note" | "risk_assessment" | "interaction_warning"
  title: string
  content: string
  confidence: number
  accepted: boolean | null
}

export type TestOrder = {
  id: string
  testType:
    | "blood"
    | "imaging"
    | "ecg"
    | "echocardiogram"
    | "holter_monitor"
    | "stress_test"
    | "nuclear_stress_test"
    | "ct_coronary_angiography"
    | "cardiac_mri"
    | "cardiac_catheterization"
    | "carotid_doppler"
    | "tilt_table_test"
    | "pulmonary_function"
    | "sleep_study"
    | "urinalysis"
    | "other"
  testName: string
  urgency: "routine" | "urgent" | "stat"
  notes: string
  location: string
  scheduledDate: string
  scheduledTime: string
  fastingRequired: boolean
}

export type ReferralEntry = {
  id: string
  specialty: string
  reason: string
  urgency: "routine" | "urgent"
}

export type HomeMeasurement = {
  id: string
  metric:
    | "blood_pressure"
    | "heart_rate"
    | "weight"
    | "blood_sugar"
    | "oxygen_saturation"
    | "temperature"
    | "symptom_log"
    | "single_lead_ecg"
    | "physical_activity"
    | "sleep_quality"
    | "other"
  metricLabel: string
  frequency: string
  timesOfDay: string[]
  duration: string
  targetRange: string
  instructions: string
}

/** Staged or persisted lab document on the consultation form. */
export type LabMaterialFile = {
  id: string
  /** Present only before the file is uploaded to object storage. */
  file?: File
  fileName: string
  fileSize: number
  documentId?: string
  panelId?: string
  uploadPhase?: "uploading" | "ready" | "error"
  uploadError?: string
}

export type ProcedurePriority = "elective" | "urgent" | "emergency"

export type ProcedureDetails = {
  procedureType: string
  surgicalSpecialty: string
  surgeryDate: string
  startTime: string
  operatingRoom: string
  anesthesiaType: string
  asaClassification: string
  estimatedDurationMin: number
  priority: ProcedurePriority
  clinicalNotes: string
}

export type ConsultationMedicalHistory = {
  noCardiacHistory: boolean
  cardiacAnswers: Record<string, string>
  cardiacNotes: string
  cardiacReviewed: boolean
  noNonCardiacHistory: boolean
  nonCardiacAnswers: Record<string, string>
  nonCardiacNotes: string
  nonCardiacReviewed: boolean
  noKnownAllergies: boolean
  noChronicConditions: boolean
}

export type ChiefComplaintStructured = {
  primaryComplaint: string
  onset: string
  duration: string
  severity: string
  character: string
  aggravating: string[]
  relieving: string[]
  associatedSymptoms: string[]
  otherComplaintDetail: string
}

export type ConsultationData = {
  /** Matches `doctor-patients` mock IDs (e.g. `p-001`) for profile navigation */
  patientId: string
  patientSummary: PatientSummary
  medicalHistory: ConsultationMedicalHistory
  lastVitalReading: ConsultationVitalReading | null
  vitals: VitalSigns
  procedureDetails: ProcedureDetails
  chiefComplaint: string
  structuredComplaint: string
  chiefComplaintStructured: ChiefComplaintStructured
  physicalExam: PhysicalExamFindings
  diagnoses: DiagnosisEntry[]
  prescriptions: PrescriptionEntry[]
  testOrders: TestOrder[]
  referrals: ReferralEntry[]
  homeMeasurements: HomeMeasurement[]
  clinicalNotes: string
  assessmentAndPlan: string
  followUpDate: string
  followUpNotes: string
  patientDiagnosisSummary: string
  patientLifestyleAdvice: string
  patientDangerSigns: string
  aiSuggestions: AISuggestion[]
}

export type ConsultationStatus = "in-progress" | "completed" | "signed"
