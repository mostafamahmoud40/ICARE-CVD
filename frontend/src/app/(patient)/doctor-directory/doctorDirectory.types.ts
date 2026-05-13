export type Specialty = {
  id: string
  name: string
  icon: string
}

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
  availability: "Available" | "Limited" | "Unavailable"
  nextAvailableSlot: string
  fee: number
  location: string
  hospital: string
  languages: string[]
}

export type DoctorDirectoryData = {
  doctors: Doctor[]
  specialties: Specialty[]
  totalDoctors: number
}
