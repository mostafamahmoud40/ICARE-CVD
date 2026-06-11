export type MedicationType =
  | "antihypertensives"
  | "antiplatelets"
  | "anticoagulants"
  | "statins"
  | "antiarrhythmics"
  | "diuretics"
  | "diabetes_medications"

export type MedicationCompliance = "good" | "poor"

export type MedicationStatus = "active" | "paused" | "discontinued"

export type TimeOfDay = "morning" | "afternoon" | "evening"

export type DoseLog = {
  id: string
  medicationId: string
  takenAt: string
  skipped: boolean
}

export type Medication = {
  id: string
  name: string
  dose: string
  frequency: string
  type: MedicationType
  compliance?: MedicationCompliance
  sideEffects?: string
  status: MedicationStatus
  prescribedBy: string
  prescribedAt: string
  startDate?: string
  durationDays?: number
  endDate?: string
  adherencePercent: number
  lastTakenAt?: string
  nextDoseAt?: string
  duration?: string
  instructions?: string
  timeOfDay: TimeOfDay[]
  remainingRefills: number
  /** Days of supply left on hand — from pharmacy/refill data when available */
  supplyDaysRemaining?: number
  /** ISO date when the next refill is due */
  nextRefillDue?: string
  adherenceHistory?: boolean[]
}

export type MedicationTypeFilter = "all" | MedicationType

export type MedicationStats = {
  totalActive: number
  takenToday: number
  dueToday: number
  adherencePercent: number
}

export type MedicationsPageData = {
  medications: Medication[]
  doseLog: DoseLog[]
  stats: MedicationStats
}
