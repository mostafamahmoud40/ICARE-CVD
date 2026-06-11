import type { PrescriptionType, TimeOfDay } from "./doctorPrescriptions.types"

export const PRESCRIPTION_TYPES: { value: PrescriptionType; label: string }[] = [
  { value: "antihypertensives", label: "Anti-hypertensives" },
  { value: "antiplatelets", label: "Antiplatelets" },
  { value: "anticoagulants", label: "Anticoagulants" },
  { value: "statins", label: "Statins" },
  { value: "antiarrhythmics", label: "Antiarrhythmics" },
  { value: "diuretics", label: "Diuretics" },
  { value: "diabetes_medications", label: "Diabetes Medications" },
]

export const TIME_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
]

export const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_4_hours", label: "Every 4 hours" },
  { value: "every_6_hours", label: "Every 6 hours" },
  { value: "every_8_hours", label: "Every 8 hours" },
  { value: "every_12_hours", label: "Every 12 hours" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "prn", label: "As needed (PRN)" },
  { value: "other", label: "Other" },
] as const

export const DURATION_OPTIONS = [
  { value: "3_days", label: "3 days" },
  { value: "5_days", label: "5 days" },
  { value: "1_week", label: "1 week" },
  { value: "2_weeks", label: "2 weeks" },
  { value: "1_month", label: "1 month" },
  { value: "3_months", label: "3 months" },
  { value: "6_months", label: "6 months" },
  { value: "1_year", label: "1 year" },
  { value: "ongoing", label: "Ongoing (no end date)" },
  { value: "other", label: "Other" },
] as const

export const SIDE_EFFECTS_BY_TYPE: Record<PrescriptionType, string> = {
  antihypertensives: "Dizziness, fatigue, dry cough, ankle swelling",
  antiplatelets: "Bruising, bleeding, stomach upset",
  anticoagulants: "Bleeding, bruising, nausea",
  statins: "Muscle aches, headache, digestive upset",
  antiarrhythmics: "Fatigue, dizziness, blurred vision",
  diuretics: "Increased urination, dehydration, low potassium",
  diabetes_medications: "Hypoglycemia, nausea, weight changes",
}

export function frequencyLabelToValue(label: string) {
  const match = FREQUENCY_OPTIONS.find((f) => f.label === label)
  return match?.value ?? "other"
}

export function frequencyValueToLabel(value: string) {
  return FREQUENCY_OPTIONS.find((f) => f.value === value)?.label ?? value
}

export function buildAiInstructions(
  medicationName: string,
  dose: string,
  frequencyValue: string,
  timeOfDay: TimeOfDay[],
) {
  const freqLabel = frequencyValueToLabel(frequencyValue)
  const times =
    timeOfDay.length > 0
      ? timeOfDay
          .map((tod) => TIME_OPTIONS.find((t) => t.value === tod)?.label.toLowerCase() ?? tod)
          .join(", ")
      : ""

  const drug = medicationName.trim() || "this medication"
  const doseText = dose.trim() || "as prescribed"
  const timing = times ? ` in the ${times}` : ""
  const frequencyText = freqLabel ? ` ${freqLabel.toLowerCase()}` : ""

  return `Take ${doseText}${frequencyText}${timing}. Swallow with a full glass of water unless your clinician advises otherwise. Do not stop ${drug} without medical review.`
}

export function buildAiSideEffects(medicationName: string, prescriptionType: PrescriptionType) {
  const common = SIDE_EFFECTS_BY_TYPE[prescriptionType]
  if (medicationName.trim()) {
    return `${common}. Monitor for new or worsening symptoms while on ${medicationName.trim()}.`
  }
  return common
}
