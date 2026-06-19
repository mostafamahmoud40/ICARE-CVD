export const PATIENT_AVATAR_OPTIONS = Array.from(
  { length: 6 },
  (_, index) => `/avatars/avatar-${index + 1}.svg`,
)

export const PATIENT_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const

export const PATIENT_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const

export const PATIENT_MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const

export const PATIENT_SMOKING_STATUSES = [
  { value: "never", label: "Never" },
  { value: "former-5", label: "Former — 5 pack-years" },
  { value: "former-10", label: "Former — 10 pack-years" },
  { value: "former-15", label: "Former — 15 pack-years" },
  { value: "former-20", label: "Former — 20+ pack-years" },
  { value: "current-5", label: "Current — 5 pack-years" },
  { value: "current-10", label: "Current — 10 pack-years" },
  { value: "current-15", label: "Current — 15 pack-years" },
  { value: "current-20", label: "Current — 20+ pack-years" },
] as const
