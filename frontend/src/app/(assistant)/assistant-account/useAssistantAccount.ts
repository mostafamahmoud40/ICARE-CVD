"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  fetchAssistantAccount,
  updateAssistantAccount,
  type AssistantAccountApiResponse,
} from "./assistantAccount.api"
import type { AssistantProfileEditValues } from "./assistantAccount.schema"
import type { AssistantProfile } from "./assistantAccount.types"

const ACCOUNT_QUERY_KEY = ["assistant", "account"] as const

export function useAssistantAccount() {
  const queryClient = useQueryClient()

  const accountQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: fetchAssistantAccount,
    staleTime: 60 * 1000,
  })

  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationKey: [...ACCOUNT_QUERY_KEY, "update"],
    mutationFn: updateAssistantAccount,
    onSuccess: (data) => {
      queryClient.setQueryData<AssistantAccountApiResponse>(ACCOUNT_QUERY_KEY, data)
      showIcareSuccessToast("Profile updated", "Your account details were saved.")
    },
  })

  const profile: AssistantProfile | null = accountQuery.data?.profile ?? null

  return {
    profile,
    isLoading: accountQuery.isLoading,
    isError: accountQuery.isError,
    error: accountQuery.error,
    refetch: accountQuery.refetch,
    saveProfile: async (values: AssistantProfileEditValues) => {
      await saveProfile(values)
    },
    isSaving,
  }
}
