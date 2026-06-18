"use client"

import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  showIcareErrorToast,
  showIcareSuccessToast,
} from "@/components/shared/icare-toast"
import { apiClient } from "@/lib/api-client"
import type {
  CreateVitalReadingInput,
  CurrentVitalsSnapshot,
  VitalHistoryRecord,
  VitalsKpiBadges,
  VitalsPageData,
  VitalsSummary,
} from "./vitals.types"
import { emptyCurrentVitals } from "./vitals.types"

const queryKey = ["patient-vitals"] as const

type VitalsOverviewApiResponse = {
  history: VitalHistoryRecord[]
  current: CurrentVitalsSnapshot
  alert: string | null
  summary: VitalsSummary | null
  aiAnalysis: VitalsPageData["aiAnalysis"]
  kpiBadges: VitalsKpiBadges
}

const emptyData: VitalsPageData = {
  history: [],
  current: emptyCurrentVitals,
  alert: null,
  summary: null,
  aiAnalysis: [],
  kpiBadges: {
    bloodPressure: null,
    heartRate: null,
    spo2: null,
    weight: null,
  },
}

async function fetchVitals(): Promise<VitalsPageData> {
  const { data } = await apiClient.get<VitalsOverviewApiResponse>("/patient/vitals")
  return data
}

export function useVitals() {
  const queryClient = useQueryClient()

  const query = useQuery<VitalsPageData, Error>({
    queryKey,
    queryFn: fetchVitals,
    staleTime: 2 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (input: CreateVitalReadingInput) => {
      const { data } = await apiClient.post("/patient/vitals", input)
      return data
    },
    onSuccess: async () => {
      showIcareSuccessToast("Reading saved", "Your vitals have been logged successfully.")
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      showIcareErrorToast(
        "Could not save reading",
        "Please check your values and try again.",
      )
    },
  })

  const addReading = useCallback(
    (input: CreateVitalReadingInput) => createMutation.mutateAsync(input),
    [createMutation],
  )

  return {
    ...query,
    data: query.data ?? emptyData,
    addReading,
    isAddingReading: createMutation.isPending,
  }
}
