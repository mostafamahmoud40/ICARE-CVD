import { apiClient } from "@/lib/api-client"
import { fetchPatientAccount } from "../account/patientAccount.api"
import type { MedicationType } from "../medications/medications.types"
import type { CurrentVitalsSnapshot, VitalsKpiBadges } from "../vitals/vitals.types"
import { emptyCurrentVitals } from "../vitals/vitals.types"
import type {
  PatientAiChatHealthContext,
  PatientAiChatLabResult,
  PatientAiChatMedication,
} from "./patientAiChatContext.types"

type MedicationApiRow = {
  id: string
  name: string
  dose: string
  frequency: string
  type: string
  status: "active" | "paused" | "discontinued"
}

type VitalsOverviewApiResponse = {
  history: Array<{ date: string }>
  current: CurrentVitalsSnapshot
  summary: { title: string; body: string } | null
  kpiBadges: VitalsKpiBadges
}

function riskScoreFromLevel(level: "low" | "moderate" | "high"): number {
  if (level === "high") return 78
  if (level === "moderate") return 55
  return 30
}

function buildRiskNote(context: {
  bmi: number | null
  smokingStatus: string | null
  summaryBody: string | null
}): string | null {
  if (context.summaryBody?.trim()) return context.summaryBody.trim()

  const parts: string[] = []
  if (context.bmi != null) parts.push(`BMI ${context.bmi}`)
  if (context.smokingStatus?.trim()) parts.push(`Smoking: ${context.smokingStatus}`)

  return parts.length > 0
    ? `Based on your profile (${parts.join(" · ")}).`
    : "Based on clinical factors in your health profile."
}

function mapMedication(row: MedicationApiRow): PatientAiChatMedication {
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    frequency: row.frequency,
    type: row.type as MedicationType,
  }
}

function dedupeLabResults(rows: PatientAiChatLabResult[]): PatientAiChatLabResult[] {
  const seen = new Set<string>()
  const unique: PatientAiChatLabResult[] = []

  for (const row of rows) {
    const key = row.testName.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(row)
    if (unique.length >= 4) break
  }

  return unique
}

export async function fetchPatientAiChatHealthContext(): Promise<PatientAiChatHealthContext> {
  const [accountResult, vitalsResult, medicationsResult, labResultsResult] =
    await Promise.allSettled([
      fetchPatientAccount(),
      apiClient.get<VitalsOverviewApiResponse>("/patient/vitals"),
      apiClient.get<MedicationApiRow[]>("/patient/medications"),
      apiClient.get<PatientAiChatLabResult[]>("/patient/lab-results"),
    ])

  const profile =
    accountResult.status === "fulfilled" ? accountResult.value.profile : null

  const vitalsPayload =
    vitalsResult.status === "fulfilled" ? vitalsResult.value.data : null

  const medications =
    medicationsResult.status === "fulfilled"
      ? medicationsResult.value.data
          .filter((row) => row.status === "active")
          .slice(0, 4)
          .map(mapMedication)
      : []

  const labResults =
    labResultsResult.status === "fulfilled"
      ? dedupeLabResults(labResultsResult.value.data)
      : []

  return {
    profile,
    riskScore: profile ? riskScoreFromLevel(profile.riskLevel) : null,
    riskNote: profile
      ? buildRiskNote({
          bmi: profile.bmi,
          smokingStatus: profile.smokingStatus,
          summaryBody: vitalsPayload?.summary?.body ?? null,
        })
      : null,
    vitals: {
      current: vitalsPayload?.current ?? emptyCurrentVitals,
      kpiBadges: vitalsPayload?.kpiBadges ?? {
        bloodPressure: null,
        heartRate: null,
        spo2: null,
        weight: null,
      },
      lastMeasuredAt: vitalsPayload?.history[0]?.date ?? null,
    },
    medications,
    labResults,
  }
}
