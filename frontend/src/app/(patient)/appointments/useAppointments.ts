"use client"

import { useQuery } from "@tanstack/react-query"

import { mockAppointmentsPage } from "./appointments.mock"
import type { AppointmentsPageData } from "./appointments.types"

export function useAppointments() {
  return useQuery<AppointmentsPageData, Error>({
    queryKey: ["patient-appointments"],
    queryFn: async () => {
      return mockAppointmentsPage
    },
    staleTime: 5 * 60 * 1000,
  })
}
