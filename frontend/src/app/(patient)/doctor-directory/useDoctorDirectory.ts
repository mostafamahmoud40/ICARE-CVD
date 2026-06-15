"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"

import {
  buildSpecialtiesFromDoctors,
  mapDirectoryDoctor,
  type DoctorDirectoryApiRow,
} from "./doctorDirectory.api"
import type { DoctorAvailabilityFilter, DoctorSortOption } from "./doctorDirectory.types"
import { filterAndSortDoctors } from "./doctorDirectory.utils"

async function fetchDoctorDirectory() {
  const { data } = await apiClient.get<DoctorDirectoryApiRow[]>("/patient/appointments/doctors/directory")
  return data.map(mapDirectoryDoctor)
}

export function useDoctorDirectory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<DoctorAvailabilityFilter>("all")
  const [sortBy, setSortBy] = useState<DoctorSortOption>("availability")

  const query = useQuery({
    queryKey: ["doctor-directory"],
    queryFn: fetchDoctorDirectory,
    staleTime: 2 * 60 * 1000,
  })

  const allDoctors = query.data ?? []
  const specialties = useMemo(() => buildSpecialtiesFromDoctors(allDoctors), [allDoctors])

  const doctors = useMemo(
    () =>
      filterAndSortDoctors(allDoctors, {
        searchQuery,
        selectedSpecialty,
        availabilityFilter,
        sortBy,
      }),
    [allDoctors, searchQuery, selectedSpecialty, availabilityFilter, sortBy],
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
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
