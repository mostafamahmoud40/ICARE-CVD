export function formatPatientDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(iso))
}

export function formatPatientShortId(patientId: string) {
  return patientId.replace(/-/g, "").slice(0, 8).toUpperCase()
}

export function formatGender(gender: string) {
  if (gender === "male") return "Male"
  if (gender === "female") return "Female"
  return "Other"
}

export function formatMaritalStatus(value: string | null | undefined) {
  if (!value) return "—"
  if (value === "single") return "Single"
  if (value === "married") return "Married"
  if (value === "divorced") return "Divorced"
  if (value === "widowed") return "Widowed"
  return value
}

export function formatSmokingStatus(value: string | null | undefined) {
  if (!value) return "—"
  if (value === "never") return "Never"
  if (value.startsWith("former")) return "Former smoker"
  if (value.startsWith("current")) return "Current smoker"
  return value
}

export function formatBloodType(value: string | null | undefined) {
  return value && value.trim() ? value : "—"
}

export function formatMetric(value: number | null | undefined, unit: string) {
  if (value == null || Number.isNaN(value)) return "—"
  return `${value} ${unit}`
}
