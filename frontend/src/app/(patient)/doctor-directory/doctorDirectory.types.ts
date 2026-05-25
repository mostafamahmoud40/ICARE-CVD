export type Specialty = {
  id: string
  name: string
  icon: string
  /** Accent color — matches assistant patient list department badges. */
  color: string
  /** Cardiology uses 🫀 on assistant screens; optional emoji overrides Lucide for this specialty. */
  emoji?: string
}

export type DoctorAvailability = "Available" | "Limited" | "Unavailable"

/** Where this doctor accepts appointments. */
export type DoctorVisitChannels = "clinic" | "virtual" | "both"

export type Doctor = {
  id: string
  name: string
  title: string
  specialty: Specialty
  experience: number
  rating: number
  reviewCount: number
  imageUrl?: string
  about: string
  availability: DoctorAvailability
  visitChannels: DoctorVisitChannels
  nextAvailableSlot: string
  fee: number
  location: string
  hospital: string
  languages: string[]
}

export type DoctorSortOption =
  | "rating"
  | "reviews"
  | "experience"
  | "fee-asc"
  | "fee-desc"
  | "name"
  | "soonest"
  | "availability"

export type DoctorAvailabilityFilter = "all" | DoctorAvailability

export type DoctorDirectoryData = {
  doctors: Doctor[]
  specialties: Specialty[]
  totalDoctors: number
}
