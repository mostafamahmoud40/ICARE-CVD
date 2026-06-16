import { apiClient } from "@/lib/api-client"
import { writeAssistantHeaderProfileCache } from "../assistantHeaderProfile.cache"
import type { AssistantProfile } from "./assistantAccount.types"
import type { AssistantProfileEditValues } from "./assistantAccount.schema"

export type AssistantAccountApiProfile = AssistantProfile

export type AssistantAccountApiResponse = {
  profile: AssistantAccountApiProfile
}

export async function fetchAssistantAccount(): Promise<AssistantAccountApiResponse> {
  const { data } = await apiClient.get<AssistantAccountApiResponse>("/assistant/account")
  writeAssistantHeaderProfileCache(data.profile)
  return data
}

export async function updateAssistantAccount(
  values: AssistantProfileEditValues,
): Promise<AssistantAccountApiResponse> {
  const { data } = await apiClient.patch<AssistantAccountApiResponse>(
    "/assistant/account",
    values,
  )
  writeAssistantHeaderProfileCache(data.profile)
  return data
}
