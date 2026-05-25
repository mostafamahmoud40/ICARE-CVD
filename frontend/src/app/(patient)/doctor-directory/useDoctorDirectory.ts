import { useMemo, useState } from "react"

import { mockDoctors, specialties } from "./doctorDirectory.mock"
import type { DoctorAvailabilityFilter, DoctorSortOption } from "./doctorDirectory.types"
import { filterAndSortDoctors } from "./doctorDirectory.utils"

export function useDoctorDirectory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<DoctorAvailabilityFilter>("all")
  const [sortBy, setSortBy] = useState<DoctorSortOption>("rating")

  const doctors = useMemo(
    () =>
      filterAndSortDoctors(mockDoctors, {
        searchQuery,
        selectedSpecialty,
        availabilityFilter,
        sortBy,
      }),
    [searchQuery, selectedSpecialty, availabilityFilter, sortBy],
  )

  const hasActiveFilters =
    selectedSpecialty !== null || availabilityFilter !== "all" || searchQuery.trim().length > 0

  function resetFilters() {
    setSearchQuery("")
    setSelectedSpecialty(null)
    setAvailabilityFilter("all")
  }

  return {
    doctors,
    specialties,
    searchQuery,
    setSearchQuery,
    selectedSpecialty,
    setSelectedSpecialty,
    availabilityFilter,
    setAvailabilityFilter,
    sortBy,
    setSortBy,
    hasActiveFilters,
    resetFilters,
  }
}
