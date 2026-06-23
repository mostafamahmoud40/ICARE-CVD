import type { MedicationType } from "../medications/medications.types"
import type { PatientAccountProfile } from "../account/patientAccount.types"
import type { CurrentVitalsSnapshot, VitalsKpiBadges } from "../vitals/vitals.types"

export type PatientAiChatLabResult = {
  id: string
  testName: string
  value: string
  unit: string | null
  referenceRange: string | null
  status: "normal" | "high" | "low" | "critical"
  resultAt: string
}

export type PatientAiChatMedication = {
  id: string
  name: string
  dose: string
  frequency: string
  type: MedicationType
}

export type PatientAiChatHealthContext = {
  profile: PatientAccountProfile | null
  riskScore: number | null
  riskNote: string | null
  vitals: {
    current: CurrentVitalsSnapshot
    kpiBadges: VitalsKpiBadges
    lastMeasuredAt: string | null
  }
  medications: PatientAiChatMedication[]
  labResults: PatientAiChatLabResult[]
}
