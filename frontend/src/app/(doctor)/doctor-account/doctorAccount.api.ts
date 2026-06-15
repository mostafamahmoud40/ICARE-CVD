import { apiClient } from "@/lib/api-client"
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

export async function fetchDoctorAccount(): Promise<DoctorAccountApiResponse> {
  const { data } = await apiClient.get<DoctorAccountApiResponse>("/doctor/account")
  writeDoctorHeaderProfileCache(data.profile)
  return data
}

export async function updateDoctorAccount(
  values: DoctorProfileEditValues,
): Promise<DoctorAccountApiResponse> {
  const { data } = await apiClient.patch<DoctorAccountApiResponse>(
    "/doctor/account",
    values,
  )
  writeDoctorHeaderProfileCache(data.profile)
  return data
}
