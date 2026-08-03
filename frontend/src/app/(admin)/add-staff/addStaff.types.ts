export type StaffRole = "doctor" | "assistant"

/** Which appointment visit types a doctor accepts. */
export type DoctorAcceptedVisitModes = "clinic" | "virtual" | "both"

export type AddStaffFormValues = {
  fullName: string
  email: string
  password?: string
  phoneNumber: string
  role: StaffRole
  specialty: string
  experienceYears: number | ""
  acceptedVisitModes: DoctorAcceptedVisitModes
  avatarUrl: string
}

export type CreatedStaffMember = {
  id: number
  fullName: string
  email: string
  phone: string | null
  role: StaffRole
  specialty: string | null
  experienceYears: number
  acceptedVisitModes: DoctorAcceptedVisitModes | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: string
}

export type AddStaffFieldErrors = Partial<Record<keyof AddStaffFormValues, string>>

export type AddStaffApiResponse = {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    avatarUrl: string | null
    role: string
  }
  accessToken: string
  refreshToken: string
}
