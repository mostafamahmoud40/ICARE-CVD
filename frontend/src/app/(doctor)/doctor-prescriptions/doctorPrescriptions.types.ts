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
  dateOfBirth: string
  gender: "male" | "female"
  activeMedications: number
  poorComplianceCount: number
}

export type PatientPrescription = {
  id: string
  patientId: string
  name: string
  dose: string
  frequency: string
  type: PrescriptionType
  compliance: PrescriptionCompliance
  sideEffects?: string
  status: PrescriptionStatus
  prescribedAt: string
  instructions?: string
  timeOfDay: TimeOfDay[]
  adherencePercent: number
  startDate?: string
  durationDays?: number
  endDate?: string
  lastTakenAt?: string
}

export type AddPrescriptionPayload = {
  patientId: string
  name: string
  dose: string
  frequency: string
  type: PrescriptionType
  sideEffects?: string
  instructions?: string
  timeOfDay: TimeOfDay[]
  durationDays?: number
  startDate?: string
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
