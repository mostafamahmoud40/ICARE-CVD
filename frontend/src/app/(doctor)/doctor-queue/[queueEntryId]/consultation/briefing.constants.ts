export type BriefingTrendPoint = {
  visitLabel: string
  systolic: number
  diastolic: number
  hba1c: number
}

export type BriefingVisitStats = {
  totalVisitsLast6Months: number
  followUpAdherencePercent: number
  medicationAdherencePercent: number
  adherenceNarrative?: string
}

export type BriefingVitalProgressPoint = {
  visitLabel: string
  sbp: number
  dbp: number
  hr: number
  spo2: number
}

export type BriefingMedicationAdherenceTrendPoint = {
  visitLabel: string
  adherence: number
  target: number
}

export type BriefingMedicationMissedBreakdownPoint = {
  medication: string
  missedPercent: number
}

export const DEFAULT_BRIEFING_TREND_DATA: BriefingTrendPoint[] = [
  { visitLabel: "V1", systolic: 158, diastolic: 98, hba1c: 8.1 },
  { visitLabel: "V2", systolic: 151, diastolic: 94, hba1c: 7.8 },
  { visitLabel: "V3", systolic: 145, diastolic: 91, hba1c: 7.5 },
  { visitLabel: "V4", systolic: 139, diastolic: 87, hba1c: 7.2 },
]

export const DEFAULT_BRIEFING_VISIT_STATS: BriefingVisitStats = {
  totalVisitsLast6Months: 4,
  followUpAdherencePercent: 88,
  medicationAdherencePercent: 84,
  adherenceNarrative:
    "Medication adherence is moderate-to-good at 84%, but there has been a noticeable decline since the last 8 weeks. Main gaps are evening doses and weekend consistency, especially for antihypertensive and diabetes medications.",
}

export const DEFAULT_BRIEFING_VITAL_PROGRESS: BriefingVitalProgressPoint[] = [
  { visitLabel: "V1", sbp: 158, dbp: 98, hr: 88, spo2: 94 },
  { visitLabel: "V2", sbp: 151, dbp: 94, hr: 84, spo2: 95 },
  { visitLabel: "V3", sbp: 145, dbp: 91, hr: 81, spo2: 96 },
  { visitLabel: "V4", sbp: 139, dbp: 87, hr: 78, spo2: 97 },
]

export const DEFAULT_MEDICATION_ADHERENCE_TREND: BriefingMedicationAdherenceTrendPoint[] = [
  { visitLabel: "V1", adherence: 74, target: 90 },
  { visitLabel: "V2", adherence: 79, target: 90 },
  { visitLabel: "V3", adherence: 82, target: 90 },
  { visitLabel: "V4", adherence: 84, target: 90 },
]

export const DEFAULT_MEDICATION_MISSED_BREAKDOWN: BriefingMedicationMissedBreakdownPoint[] = [
  { medication: "Amlodipine", missedPercent: 18 },
  { medication: "Metformin", missedPercent: 22 },
  { medication: "Atorvastatin", missedPercent: 12 },
  { medication: "Aspirin", missedPercent: 10 },
]
