"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import { fetchPatientAccount, updatePatientAccount } from "./patientAccount.api"
import type { PatientProfileEditValues } from "./patientAccount.schema"
import type { PatientAccountApiResponse } from "./patientAccount.types"

const ACCOUNT_QUERY_KEY = ["patient", "account"] as const

export function usePatientAccount() {
  const t = useTranslations("patient.account")
  const queryClient = useQueryClient()

  const accountQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: fetchPatientAccount,
    staleTime: 60_000,
  })

  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationKey: [...ACCOUNT_QUERY_KEY, "update"],
    mutationFn: updatePatientAccount,
    onSuccess: (data) => {
      queryClient.setQueryData<PatientAccountApiResponse>(ACCOUNT_QUERY_KEY, data)
      showIcareSuccessToast(t("profileSavedTitle"), t("profileSavedDesc"))
    },
  })

  return {
    profile: accountQuery.data?.profile ?? null,
    isLoading: accountQuery.isLoading,
    isError: accountQuery.isError,
    error: accountQuery.error,
    refetch: accountQuery.refetch,
    saveProfile: async (values: PatientProfileEditValues) => {
      await saveProfile(values)
    },
    isSaving,
  }
}
