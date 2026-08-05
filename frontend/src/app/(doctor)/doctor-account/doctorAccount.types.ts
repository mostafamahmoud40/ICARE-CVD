export type DoctorVisitModes = "clinic" | "virtual" | "both"

export type DoctorProfile = {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl: string | null
  specialty: string
  title: string
  experienceYears: number
  clinicName: string
  clinicLocation: string
  licenseNumber: string
  joinedAt: string
  acceptedVisitModes: DoctorVisitModes
  languages: string[]
  about: string
  rating: number
  reviewCount: number
  clinicConsultationFee: number
  onlineConsultationFee: number
}

export type DoctorPracticeStats = {
  patientsToday: number
  appointmentsThisWeek: number
  completedConsultations: number
  averageRating: number
}

export type DoctorWeeklySnapshot = {
  day: string
  appointments: number
  completed: number
  cancellations: number
}

export type DoctorReview = {
  id: string
  patientName: string
  rating: number
  comment: string
  date: string
}
