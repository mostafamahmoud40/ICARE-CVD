import { useState, useMemo } from "react"
import { mockDoctors, specialties } from "./doctorDirectory.mock"
import type { Doctor } from "./doctorDirectory.types"

export function useDoctorDirectory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"rating" | "experience" | "fee">("rating")

  const filteredDoctors = useMemo(() => {
    return mockDoctors
      .filter((doctor) => {
        const matchesSearch =
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialty.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSpecialty = selectedSpecialty
          ? doctor.specialty.id === selectedSpecialty
          : true
        return matchesSearch && matchesSpecialty
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating
        if (sortBy === "experience") return b.experience - a.experience
        if (sortBy === "fee") return a.fee - b.fee
        return 0
      })
  }, [searchQuery, selectedSpecialty, sortBy])

  return {
    doctors: filteredDoctors,
    specialties,
    searchQuery,
    setSearchQuery,
    selectedSpecialty,
    setSelectedSpecialty,
    sortBy,
    setSortBy,
  }
}
