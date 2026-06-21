import { apiClient } from "@/lib/api-client"
import { patchAuthUser } from "@/lib/auth-tokens"
import { writeDoctorHeaderProfileCache } from "../doctorHeaderProfile.cache"
import type {
  DoctorPracticeStats,
  DoctorProfile,
  DoctorWeeklySnapshot,
} from "./doctorAccount.types"
import type { DoctorProfileEditValues } from "./doctorAccount.schema"

export type DoctorAccountApiProfile = Omit<DoctorProfile, "rating" | "reviewCount">

export type DoctorAccountApiResponse = {
  profile: DoctorAccountApiProfile
  practiceStats: Omit<DoctorPracticeStats, "averageRating">
  weeklySnapshot: DoctorWeeklySnapshot[]
}

export type DoctorAccountPatch = Partial<DoctorProfileEditValues>

function syncAuthUserFromProfile(profile: DoctorAccountApiProfile) {
  patchAuthUser({
    name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    avatarUrl: profile.avatarUrl ?? null,
  })
}

export async function fetchDoctorAccount(): Promise<DoctorAccountApiResponse> {
  const { data } = await apiClient.get<DoctorAccountApiResponse>("/doctor/account")
  writeDoctorHeaderProfileCache(data.profile)
  syncAuthUserFromProfile(data.profile)
  return data
}

export async function updateDoctorAccount(
  values: DoctorAccountPatch,
): Promise<DoctorAccountApiResponse> {
  const { data } = await apiClient.patch<DoctorAccountApiResponse>(
    "/doctor/account",
    values,
  )
  writeDoctorHeaderProfileCache(data.profile)
  syncAuthUserFromProfile(data.profile)
  return data
}
