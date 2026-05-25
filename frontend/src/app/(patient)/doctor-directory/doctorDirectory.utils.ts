import type {
  Doctor,
  DoctorAvailability,
  DoctorAvailabilityFilter,
  DoctorSortOption,
  DoctorVisitChannels,
} from "./doctorDirectory.types"

export const DOCTOR_VISIT_CHANNELS_LABELS: Record<DoctorVisitChannels, string> = {
  clinic: "Clinic only",
  virtual: "Online only",
  both: "Clinic & online",
}

const AVAILABILITY_ORDER: Record<DoctorAvailability, number> = {
  Available: 0,
  Limited: 1,
  Unavailable: 2,
}

export const DOCTOR_SORT_OPTIONS: { value: DoctorSortOption; label: string }[] = [
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviews" },
  { value: "experience", label: "Most experienced" },
  { value: "soonest", label: "Soonest appointment" },
  { value: "availability", label: "Available first" },
  { value: "fee-asc", label: "Lowest fee" },
  { value: "fee-desc", label: "Highest fee" },
  { value: "name", label: "Name (A–Z)" },
]

export function doctorMatchesSearch(doctor: Doctor, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    doctor.name.toLowerCase().includes(q) ||
    doctor.specialty.name.toLowerCase().includes(q) ||
    doctor.hospital.toLowerCase().includes(q) ||
    doctor.location.toLowerCase().includes(q) ||
    doctor.title.toLowerCase().includes(q)
  )
}

export function compareDoctors(a: Doctor, b: Doctor, sortBy: DoctorSortOption): number {
  switch (sortBy) {
    case "rating":
      return b.rating - a.rating || b.reviewCount - a.reviewCount
    case "reviews":
      return b.reviewCount - a.reviewCount || b.rating - a.rating
    case "experience":
      return b.experience - a.experience || b.rating - a.rating
    case "fee-asc":
      return a.fee - b.fee
    case "fee-desc":
      return b.fee - a.fee
    case "name":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    case "soonest":
      return (
        new Date(a.nextAvailableSlot).getTime() - new Date(b.nextAvailableSlot).getTime()
      )
    case "availability": {
      const diff = AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability]
      if (diff !== 0) return diff
      return (
        new Date(a.nextAvailableSlot).getTime() - new Date(b.nextAvailableSlot).getTime()
      )
    }
    default:
      return 0
  }
}

export function filterAndSortDoctors(
  doctors: Doctor[],
  {
    searchQuery,
    selectedSpecialty,
    availabilityFilter,
    sortBy,
  }: {
    searchQuery: string
    selectedSpecialty: string | null
    availabilityFilter: DoctorAvailabilityFilter
    sortBy: DoctorSortOption
  },
): Doctor[] {
  return doctors
    .filter((doctor) => {
      if (!doctorMatchesSearch(doctor, searchQuery)) return false
      if (selectedSpecialty && doctor.specialty.id !== selectedSpecialty) return false
      if (availabilityFilter !== "all" && doctor.availability !== availabilityFilter) return false
      return true
    })
    .sort((a, b) => compareDoctors(a, b, sortBy))
}
