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
  testType: "blood" | "imaging" | "ecg" | "echocardiogram" | "stress_test" | "cardiac_catheterization" | "pulmonary_function" | "urinalysis" | "other"
  testName: string
  urgency: "routine" | "urgent" | "stat"
  notes: string
  location: string
  scheduledDate: string
  scheduledTime: string
  fastingRequired: boolean
}

export type HomeMeasurement = {
  id: string
  metric: "blood_pressure" | "heart_rate" | "weight" | "blood_sugar" | "oxygen_saturation" | "temperature" | "other"
  metricLabel: string
  frequency: string
  timesOfDay: string[]
  duration: string
  targetRange: string
  instructions: string
}

export type ConsultationData = {
  /** Matches `doctor-patients` mock IDs (e.g. `p-001`) for profile navigation */
  patientId: string
  patientSummary: PatientSummary
  vitals: VitalSigns
  chiefComplaint: string
  structuredComplaint: string
  physicalExam: PhysicalExamFindings
  diagnoses: DiagnosisEntry[]
  prescriptions: PrescriptionEntry[]
  testOrders: TestOrder[]
  homeMeasurements: HomeMeasurement[]
  clinicalNotes: string
  assessmentAndPlan: string
  followUpDate: string
  followUpNotes: string
  aiSuggestions: AISuggestion[]
}

export type ConsultationStatus = "in-progress" | "completed" | "signed"
