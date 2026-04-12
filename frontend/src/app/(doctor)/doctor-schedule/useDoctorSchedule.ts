"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"

import { doctorScheduleSchema } from "./doctorSchedule.schema"
import { defaultDoctorSchedule } from "./doctorSchedule.mock"
import type { DoctorSchedulePayload } from "./doctorSchedule.types"
import { migrateLegacyDoctorSchedule } from "./doctorSchedule.utils"

const QUERY_KEY = ["doctor-schedule"] as const
const STORAGE_KEY = "icare-cvd-doctor-schedule"

function readStoredSchedule(): DoctorSchedulePayload | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const migrated = migrateLegacyDoctorSchedule(parsed)
    return doctorScheduleSchema.parse(migrated ?? parsed)
  } catch {
    return null
  }
}

async function fetchDoctorSchedule(): Promise<DoctorSchedulePayload> {
  await Promise.resolve()
  if (typeof window === "undefined") {
    return defaultDoctorSchedule
  }
  return readStoredSchedule() ?? defaultDoctorSchedule
}

async function persistSchedule(payload: DoctorSchedulePayload): Promise<DoctorSchedulePayload> {
  const validated = doctorScheduleSchema.parse(payload)

  try {
    const { data } = await apiClient.put<DoctorSchedulePayload>(
      "/doctor/schedule",
      validated
    )
    const next = doctorScheduleSchema.parse(data)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    }
    return next
  } catch {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
    }
    return validated
  }
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
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
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

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveSchedule: saveMutation.mutate,
    saveScheduleAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  }
}
