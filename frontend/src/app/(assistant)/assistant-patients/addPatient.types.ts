export type MedicationItem = {
  id: string
  name: string
  dose: string
  frequency: string
  type: string
  compliance: string
  sideEffects: string
}

export type AllergyItem = {
  id: string
  category: string
  allergen: string
  reaction: string
}

export type AddPatientFormValues = {
  fullName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  nationalId: string
  bloodType: string
  address: string
  heightCm: string
  weightKg: string
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  stressLevel: string
  maritalStatus: string
  occupation: string
  caffeineIntake: string
  recreationalDrugUse: string
  exerciseDuration: string
  exerciseType: string
  physicalActivityLevel: string
  dietaryHabits: string
  chiefComplaint: string
  otherChiefComplaint: string
  medicalHistoryNotes: string
  /** Structured medication entries matching database schema. */
  medications: MedicationItem[]
  /** Structured allergy entries matching database schema. */
  allergies: AllergyItem[]
}

export type CreatedPatient = {
  id: number
  fullName: string
  email: string
  phone: string | null
  dateOfBirth: string | null
  gender: string | null
  nationalId: string | null
  bloodType: string | null
  address: string | null
  heightCm: number | null
  weightKg: number | null
  smokingStatus: string | null
  chiefComplaint: string | null
  createdAt: string
}

export type AddPatientFieldErrors = Partial<Record<keyof AddPatientFormValues, string>>

export type AddPatientApiResponse = {
  patient: {
    id: number
    fullName: string
    email: string
    phone: string | null
    dateOfBirth: string | null
    gender: string | null
    nationalId: string | null
  }
}
