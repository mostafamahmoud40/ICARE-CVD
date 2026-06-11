import type {
  AiInsight,
  ContactHistoryEvent,
  DoctorEscalation,
  MedicationFlag,
  RiskTier,
} from "@/app/(assistant)/assistant-medications/assistantMedications.types"

export type DoctorPatientClinicalContext = {
  phone: string | null
  riskTier: RiskTier
  followUpCount: number
  flags: MedicationFlag[]
  aiInsights: AiInsight[]
  contactHistory: ContactHistoryEvent[]
  escalations: DoctorEscalation[]
}

export function computeAgeFromDob(dateOfBirth: string) {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDelta = today.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age -= 1
  return age
}

export function deriveRiskTier(poorCount: number, avgAdherence: number): RiskTier {
  if (poorCount >= 2 || avgAdherence < 65) return "high"
  if (poorCount >= 1 || avgAdherence < 85) return "medium"
  return "low"
}

export function deriveAdherenceHistory7d(adherencePercent: number) {
  const takenCount = Math.round((Math.min(100, Math.max(0, adherencePercent)) / 100) * 7)
  return Array.from({ length: 7 }, (_, index) => index < takenCount)
}

/** Demo clinical workflow data until doctor adherence APIs ship. */
export function getDoctorPatientClinicalContext(
  patientId: string,
  patientName: string,
  poorCount: number,
  avgAdherence: number,
): DoctorPatientClinicalContext {
  const riskTier = deriveRiskTier(poorCount, avgAdherence)
  const firstName = patientName.split(" ")[0] ?? patientName

  const flags: MedicationFlag[] =
    poorCount > 0
      ? [
          {
            id: `flag-${patientId}-1`,
            medicationLineId: "rx",
            patientId,
            reason:
              poorCount >= 2
                ? "Multiple medications below target adherence — review regimen and barriers."
                : "Missed doses reported this week — confirm tolerance and timing with patient.",
            severity: poorCount >= 2 ? "critical" : "watch",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdByLabel: "Care assistant",
            status: "open",
          },
        ]
      : []

  const aiInsights: AiInsight[] = [
    {
      id: `ai-${patientId}-1`,
      patientId,
      kind: "adherence",
      title: avgAdherence < 85 ? "Adherence dip detected" : "Stable adherence pattern",
      detail:
        avgAdherence < 85
          ? `${firstName} may benefit from a simplified evening schedule or refill coordination before the next clinic visit.`
          : `${firstName} is maintaining consistent dosing. Continue current plan and monitor at next follow-up.`,
      confidencePct: avgAdherence < 85 ? 81 : 74,
    },
    ...(poorCount > 0
      ? [
          {
            id: `ai-${patientId}-2`,
            patientId,
            kind: "interaction" as const,
            title: "Assistant escalation pending",
            detail:
              "Care team flagged adherence risk. Review whether dose, timing, or side effects need a prescription change.",
            confidencePct: 88,
          },
        ]
      : []),
  ]

  const contactHistory: ContactHistoryEvent[] = [
    {
      id: `ch-${patientId}-1`,
      patientId,
      channel: "sms",
      status: "delivered",
      summary: "Medication check-in",
      messagePreview: `Hi ${firstName}, please confirm you are taking your medicines as prescribed this week.`,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdByLabel: "Care assistant",
    },
    {
      id: `ch-${patientId}-2`,
      patientId,
      channel: "call",
      status: "replied",
      summary: "Adherence follow-up",
      messagePreview: "Patient reported occasional missed evening doses during work shifts.",
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      createdByLabel: "Care assistant",
    },
  ]

  const escalations: DoctorEscalation[] =
    poorCount > 0
      ? [
          {
            id: `esc-${patientId}-1`,
            patientId,
            medicationLineId: null,
            priority: poorCount >= 2 ? "urgent" : "routine",
            reason: "Assistant requested prescriber review for adherence risk.",
            note: `${firstName} may need dose adjustment, counseling, or a shorter follow-up interval.`,
            status: "waiting_review",
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            createdByLabel: "Care assistant",
          },
        ]
      : []

  return {
    phone: "+20 100 000 0000",
    riskTier,
    followUpCount: escalations.length + flags.length,
    flags,
    aiInsights,
    contactHistory,
    escalations,
  }
}
