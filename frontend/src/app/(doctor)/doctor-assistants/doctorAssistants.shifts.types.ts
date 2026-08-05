export type AssistantShiftStatus = "active" | "half-day" | "holiday"

export type AssistantShiftWeekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"

export type AssistantWeeklyShiftDay = {
  weekday: AssistantShiftWeekday
  status: AssistantShiftStatus
  startTime: string | null
  endTime: string | null
  note?: string | null
}

export type AssistantShiftSchedule = {
  assistantUserId: number
  assistantId: string
  assistantName: string
  clinicName: string | null
  days: AssistantWeeklyShiftDay[]
}
