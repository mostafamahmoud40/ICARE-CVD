export type PrescriptionType =
  | "antihypertensives"
  | "antiplatelets"
  | "anticoagulants"
  | "statins"
  | "antiarrhythmics"
  | "diuretics"
  | "diabetes_medications"

export type PrescriptionCompliance = "good" | "poor"

export type PrescriptionStatus = "active" | "paused" | "discontinued"

export type TimeOfDay = "morning" | "afternoon" | "evening"

export type PatientInfo = {
  id: string
  fullName: string
  age: number
  gender: "male" | "female"
  condition: string
}

export type PatientPrescription = {
  id: string
  patientId: string
  name: string
  dose: string
  frequency: string
  duration?: string
  type: PrescriptionType
  compliance: PrescriptionCompliance
  sideEffects?: string
  status: PrescriptionStatus
  prescribedAt: string
  instructions?: string
  timeOfDay: TimeOfDay[]
  adherencePercent: number
  lastTakenAt?: string
}

export type AddPrescriptionPayload = {
  patientId: string
  name: string
  dose: string
  frequency: string
  duration?: string
  type: PrescriptionType
  sideEffects?: string
  instructions?: string
  timeOfDay: TimeOfDay[]
}

export type UpdatePrescriptionPayload = {
  dose?: string
  frequency?: string
  sideEffects?: string
  instructions?: string
  compliance?: PrescriptionCompliance
  status?: PrescriptionStatus
  timeOfDay?: TimeOfDay[]
}

export type PrescriptionStats = {
  totalPatients: number
  totalPrescriptions: number
  activePrescriptions: number
  poorComplianceCount: number
}

export type DoctorPrescriptionsPageData = {
  patients: PatientInfo[]
  prescriptions: PatientPrescription[]
  stats: PrescriptionStats
}
