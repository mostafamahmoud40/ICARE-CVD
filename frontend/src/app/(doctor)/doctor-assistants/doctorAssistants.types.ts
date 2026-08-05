export type DoctorAssistantFormValues = {
  fullName: string
  email: string
  password: string
  phoneNumber: string
  department: string
  experienceYears: number | ""
  avatarUrl: string
}

export type DoctorAssistantMember = {
  id: number
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  isActive: boolean
  department: string | null
  experienceYears: number
  linkedAt: string
  createdAt: string
}

export type DoctorAssistantFieldErrors = Partial<
  Record<keyof DoctorAssistantFormValues, string>
>
