import type {
  PatientAllergyEntry,
  PatientCareGoal,
  PatientClinicalNote,
  PatientFullRecord,
} from "../doctorPatients.types"

export const riskConfig: Record<string, { label: string; dot: string; badge: string }> = {
  low: { label: "Low Risk", dot: "bg-emerald-100", badge: "bg-emerald-500 text-white shadow-sm" },
  moderate: { label: "Moderate Risk", dot: "bg-amber-100", badge: "bg-amber-500 text-white shadow-sm" },
  high: { label: "High Risk", dot: "bg-red-100", badge: "bg-red-500 text-white shadow-sm" },
}

export const ALLERGY_CATEGORY_LABELS: Record<PatientAllergyEntry["category"], string> = {
  drug: "Drug",
  food: "Food",
  other: "Other",
}

export type AllergyForm = {
  category: PatientAllergyEntry["category"]
  allergen: string
  reaction: string
}

export function emptyAllergyForm(): AllergyForm {
  return { category: "drug", allergen: "", reaction: "" }
}

export const FAMILY_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Daughter",
  "Son",
  "Cousin",
  "Other",
] as const

export type FamilyHistoryForm = {
  relationship: string
  condition: string
  details: string
}

export function emptyFamilyHistoryForm(): FamilyHistoryForm {
  return { relationship: "", condition: "", details: "" }
}

export type DisplayClinicalNote = PatientClinicalNote & { canDelete: boolean }

export const CARE_GOAL_STATUS_OPTIONS: Array<{ value: PatientCareGoal["status"]; label: string }> = [
  { value: "on-track", label: "On track" },
  { value: "off-track", label: "Off track" },
  { value: "achieved", label: "Achieved" },
]

export function emptyCareGoalForm() {
  return {
    metric: "",
    target: "",
    current: "",
    status: "on-track" as PatientCareGoal["status"],
  }
}

export const APPOINTMENT_TYPE_REASON: Record<string, string> = {
  "follow-up": "Follow-up visit",
  new: "New consultation",
  "post-procedure": "Post-procedure follow-up",
  urgent: "Urgent consultation",
}

export type PatientProfileProps = {
  record: PatientFullRecord
}
