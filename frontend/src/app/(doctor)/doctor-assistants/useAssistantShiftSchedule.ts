"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toast } from "sonner"

import {
  fetchAssistantShiftSchedule,
  saveAssistantShiftSchedule,
} from "./doctorAssistants.shifts.api"
import type { AssistantWeeklyShiftDay } from "./doctorAssistants.shifts.types"

export function assistantShiftScheduleQueryKey(assistantUserId: number) {
  return ["doctor-assistant-shifts", assistantUserId] as const
}

export function useAssistantShiftSchedule(assistantUserId: number | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: assistantShiftScheduleQueryKey(assistantUserId ?? 0),
    queryFn: () => fetchAssistantShiftSchedule(assistantUserId!),
    enabled: assistantUserId !== null,
    staleTime: 30 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: (days: AssistantWeeklyShiftDay[]) =>
      saveAssistantShiftSchedule(assistantUserId!, days),
    onSuccess: async (data) => {
      await queryClient.setQueryData(
        assistantShiftScheduleQueryKey(assistantUserId!),
        data,
      )
      toast.success("Shift schedule saved", {
        description: `${data.assistantName}'s weekly shifts were updated.`,
      })
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            error.message)
          : "Something went wrong. Try again."
      toast.error("Could not save shifts", { description: message })
    },
  })

  return {
    schedule: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveShifts: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  }
}
