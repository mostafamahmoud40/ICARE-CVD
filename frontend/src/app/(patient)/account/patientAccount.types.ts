export type PatientAccountProfile = {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl: string | null
  role: "patient"
  dateOfBirth: string
  age: number
  gender: "male" | "female" | "other"
  bloodType: string | null
  nationalId: string
  address: string
  maritalStatus: "single" | "married" | "divorced" | "widowed" | null
  occupation: string
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  smokingStatus: string | null
  riskLevel: "low" | "moderate" | "high"
  memberSince: string
}

export type PatientAccountApiResponse = {
  profile: PatientAccountProfile
}
