export type StaffRole = "doctor" | "assistant"

export type AddStaffFormValues = {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  role: StaffRole
  specialty: string
  experienceYears: number | ""
}

export type CreatedStaffMember = {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: StaffRole
  specialty: string | null
  experienceYears: number
  createdAt: string
}

export type AddStaffFieldErrors = Partial<Record<keyof AddStaffFormValues, string>>

export type AddStaffApiResponse = {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    role: string
  }
  accessToken: string
  refreshToken: string
}
