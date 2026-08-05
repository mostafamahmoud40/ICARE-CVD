export const PATIENT_EXERCISE_FREQUENCY_OPTIONS = [
  { value: "none", label: "Sedentary (no regular exercise)" },
  { value: "rarely-monthly", label: "Rarely (1–2 times/month)" },
  { value: "occasional-monthly", label: "Occasionally (3–4 times/month)" },
  { value: "1-week", label: "Light (1 day/week)" },
  { value: "1-2", label: "Light (1–2 days/week)" },
  { value: "3-4", label: "Moderate (3–4 days/week)" },
  { value: "5+", label: "Active (5+ days/week)" },
  { value: "daily", label: "Very active (daily)" },
] as const

export type PatientExerciseFrequencyValue =
  (typeof PATIENT_EXERCISE_FREQUENCY_OPTIONS)[number]["value"]

export function patientExerciseFrequencyLabel(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null
  return (
    PATIENT_EXERCISE_FREQUENCY_OPTIONS.find((opt) => opt.value === value)?.label ??
    value
  )
}
