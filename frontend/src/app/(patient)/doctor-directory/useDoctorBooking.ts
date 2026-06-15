"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/lib/api-client"

import {
  buildDoctorBookingPageData,
  type DoctorAvailabilityApi,
  type DoctorDirectoryApiRow,
} from "./doctorDirectory.api"
import type { DoctorBookingPageData } from "./doctorBooking.types"

type CreateAppointmentPayload = {
  doctorId: string
  scheduledAt: string
  visitType: "clinic" | "virtual"
  reason: string
}

async function fetchDoctorBookingPage(doctorId: string): Promise<DoctorBookingPageData> {
  const [doctorResult, availabilityResult] = await Promise.all([
    apiClient.get<DoctorDirectoryApiRow>(`/patient/appointments/doctors/${doctorId}`),
    apiClient.get<DoctorAvailabilityApi>(
      `/patient/appointments/doctors/${doctorId}/availability`,
    ),
  ])

  return buildDoctorBookingPageData(doctorResult.data, availabilityResult.data)
}

export function useDoctorBooking(doctorId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["doctor-booking", doctorId],
    queryFn: () => fetchDoctorBookingPage(doctorId),
    enabled: doctorId.length > 0,
    staleTime: 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      const { data } = await apiClient.post("/patient/appointments", payload)
      return data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient-appointments"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-directory"] }),
        queryClient.invalidateQueries({ queryKey: ["doctor-booking", doctorId] }),
      ])
    },
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createAppointment: createMutation.mutateAsync,
    isCreatingAppointment: createMutation.isPending,
  }
}
