export type DoctorStatus = "available" | "in-consultation" | "away"
export type LoadLevel = "optimal" | "moderate" | "high" | "inactive"

export type AssistantDoctorDirectoryItem = {
  id: string
  name: string
  specialty: string
  status: DoctorStatus
  patientsWaiting: number
  loadLevel: LoadLevel
  avatarUrl?: string | null
  room?: string
  shiftStart?: string | null
  shiftEnd?: string | null
}

export type AssistantDoctorScheduleDay = {
  weekday: string
  label: string
  enabled: boolean
  periods: Array<{ startTime: string; endTime: string }>
  availableSlotCount?: number
  availableSlotTimes?: string[]
  nextOccurrenceDate?: string | null
}

export type AssistantDoctorClinicProfile = {
  id: string
  name: string
  avatarUrl?: string | null
  specialty: string
  title: string
  experienceYears: number
  about: string
  clinicName: string
  clinicLocation: string
  acceptedVisitModes: "clinic" | "virtual" | "both"
  languages: string[]
  status: DoctorStatus
  patientsWaiting: number
  patientsInConsultation: number
  room?: string
  todayShiftStart?: string | null
  todayShiftEnd?: string | null
  schedule: {
    slotDurationMinutes: number
    bufferBetweenSlotsMinutes: number
    days: AssistantDoctorScheduleDay[]
  }
}

/** @deprecated Use AssistantDoctorDirectoryItem from live API */
export type DoctorProfile = AssistantDoctorDirectoryItem
