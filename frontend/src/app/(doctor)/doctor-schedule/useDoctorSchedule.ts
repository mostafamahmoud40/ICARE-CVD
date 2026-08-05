"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"

import { doctorScheduleSchema } from "./doctorSchedule.schema"
import type { DoctorSchedulePayload } from "./doctorSchedule.types"
import { createEmptySchedule } from "./doctorSchedule.utils"

const QUERY_KEY = ["doctor-schedule"] as const

async function fetchDoctorSchedule(): Promise<DoctorSchedulePayload> {
  try {
    const { data } = await apiClient.get<DoctorSchedulePayload>("/doctor/schedule")
    return doctorScheduleSchema.parse(data)
  } catch {
    return createEmptySchedule()
  }
}

async function persistSchedule(payload: DoctorSchedulePayload): Promise<DoctorSchedulePayload> {
  const validated = doctorScheduleSchema.parse(payload)
  const { data } = await apiClient.put<DoctorSchedulePayload>("/doctor/schedule", validated)
  return doctorScheduleSchema.parse(data)
}

async function deleteSchedule(): Promise<void> {
  await apiClient.delete("/doctor/schedule")
}

export function useDoctorSchedule() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDoctorSchedule,
    staleTime: 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: persistSchedule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Schedule saved", {
        description: "Your weekly availability has been updated.",
      })
    },
    onError: () => {
      toast.error("Could not save schedule", {
        description: "Try again in a moment.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success("Schedule deleted", {
        description: "Your schedule has been cleared. You can start fresh.",
      })
    },
    onError: () => {
      toast.error("Could not delete schedule", {
        description: "Try again in a moment.",
      })
    },
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveSchedule: saveMutation.mutate,
    saveScheduleAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    deleteScheduleAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
