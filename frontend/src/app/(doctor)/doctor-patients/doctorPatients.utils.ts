import type { DoctorPatientsPagePatient } from "./doctorPatients.types"

export function patientDisplayId(patient: Pick<DoctorPatientsPagePatient, "id" | "nationalId">) {
  const nationalId = patient.nationalId?.trim()
  if (nationalId) return nationalId

  const id = patient.id.trim()
  if (/^p-\d+/i.test(id)) return id.toUpperCase()

  return `PT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`
}

export function calcPatientAge(dob: string) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDelta = today.getMonth() - birth.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const SMOKING_LABELS: Record<string, string> = {
  never: "Never",
  "former-5": "Former — 5 pack-years",
  "former-10": "Former — 10 pack-years",
  "former-15": "Former — 15 pack-years",
  "former-20": "Former — 20+ pack-years",
  "current-5": "Current — 5 pack-years",
  "current-10": "Current — 10 pack-years",
  "current-15": "Current — 15 pack-years",
  "current-20": "Current — 20+ pack-years",
}

export function formatSmokingStatus(value: string | null | undefined) {
  if (!value?.trim()) return ""
  return SMOKING_LABELS[value] ?? value
}

export function formatMaritalStatus(value: string | null | undefined) {
  if (!value?.trim()) return ""
  return value.charAt(0).toUpperCase() + value.slice(1)
}
