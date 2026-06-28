import { apiClient } from "@/lib/api-client"

import type {
  AssistantShiftSchedule,
  AssistantWeeklyShiftDay,
} from "./doctorAssistants.shifts.types"

export async function fetchAssistantShiftSchedule(
  assistantUserId: number,
): Promise<AssistantShiftSchedule> {
  const { data } = await apiClient.get<AssistantShiftSchedule>(
    `/doctor/assistants/${assistantUserId}/shifts`,
  )
  return data
}

export async function saveAssistantShiftSchedule(
  assistantUserId: number,
  days: AssistantWeeklyShiftDay[],
): Promise<AssistantShiftSchedule> {
  const { data } = await apiClient.patch<AssistantShiftSchedule>(
    `/doctor/assistants/${assistantUserId}/shifts`,
    { days },
  )
  return data
}
