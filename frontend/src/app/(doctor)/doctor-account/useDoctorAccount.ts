"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  fetchDoctorAccount,
  updateDoctorAccount,
  type DoctorAccountApiResponse,
} from "./doctorAccount.api"
import { MOCK_DOCTOR_RATING, MOCK_DOCTOR_REVIEWS } from "./doctorAccount.mock"
import type { DoctorProfileEditValues } from "./doctorAccount.schema"
import type { DoctorPracticeStats, DoctorProfile } from "./doctorAccount.types"

const ACCOUNT_QUERY_KEY = ["doctor", "account"] as const

function mergeProfile(
  apiProfile: DoctorAccountApiResponse["profile"],
): DoctorProfile {
  return {
    ...apiProfile,
    rating: MOCK_DOCTOR_RATING.rating,
    reviewCount: MOCK_DOCTOR_RATING.reviewCount,
  }
}

function mergePracticeStats(
  stats: DoctorAccountApiResponse["practiceStats"],
): DoctorPracticeStats {
  return {
    ...stats,
    averageRating: MOCK_DOCTOR_RATING.rating,
  }
}

export function useDoctorAccount() {
  const queryClient = useQueryClient()

  const accountQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEY,
    queryFn: fetchDoctorAccount,
    staleTime: 60 * 1000,
  })

  const { mutateAsync: saveProfile, isPending: isSaving } = useMutation({
    mutationKey: [...ACCOUNT_QUERY_KEY, "update"],
    mutationFn: updateDoctorAccount,
    onSuccess: (data) => {
      queryClient.setQueryData<DoctorAccountApiResponse>(ACCOUNT_QUERY_KEY, data)
      showIcareSuccessToast("Profile updated", "Your account details were saved.")
    },
  })

  const profile = accountQuery.data ? mergeProfile(accountQuery.data.profile) : null
  const practiceStats = accountQuery.data
    ? mergePracticeStats(accountQuery.data.practiceStats)
    : null

  return {
    profile,
    practiceStats,
    weeklySnapshot: accountQuery.data?.weeklySnapshot ?? [],
    reviews: MOCK_DOCTOR_REVIEWS,
    isLoading: accountQuery.isLoading,
    isError: accountQuery.isError,
    error: accountQuery.error,
    refetch: accountQuery.refetch,
    saveProfile: async (values: DoctorProfileEditValues) => {
      await saveProfile(values)
    },
    isSaving,
  }
}
