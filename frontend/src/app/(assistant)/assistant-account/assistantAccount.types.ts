export type AssistantProfile = {
  id: string
  fullName: string
  email: string
  phone: string
  avatarUrl: string | null
  role: "assistant"
  department: string
  experienceYears: number
  joinedAt: string
}

export type AssistantWorkStats = {
  patientsHandledToday: number
  appointmentsScheduled: number
  tasksCompleted: number
  queueManaged: number
}

export type ActivityEntry = {
  id: string
  action: string
  description: string
  timestamp: string
  type: "patient" | "appointment" | "queue" | "document"
}

export type SecurityInfo = {
  twoFactorEnabled: boolean
  lastPasswordChange: string
  activeSessions: number
  lastLogin: string
}

export type AssistantPreferences = {
  emergencyAlerts: boolean
  appointmentReminders: boolean
  checklistUpdates: boolean
  doctorMessages: boolean
  language: "en"
  theme: "light" | "dark" | "system"
}

export type WeeklyStat = {
  day: string
  patients: number
  appointments: number
  tasks: number
}

export type ShiftScheduleStatus = "active" | "half-day" | "holiday"

export type ShiftEntry = {
  id: string
  /** Display name for the day, e.g. Sunday */
  dayName: string
  /** Short label inside the day avatar, e.g. Su */
  dayBadge: string
  /** e.g. 9:00 AM — 5:00 PM; null when day is off */
  timeRange: string | null
  status: ShiftScheduleStatus
  /** Optional detail under the time (clinic, doctor, etc.) */
  note?: string
}
