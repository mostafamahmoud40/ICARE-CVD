import type {
  AssistantProfile,
  AssistantWorkStats,
  ActivityEntry,
  SecurityInfo,
  AssistantPreferences,
  WeeklyStat,
  ShiftEntry,
} from "./assistantAccount.types"

export const MOCK_PROFILE: AssistantProfile = {
  id: "ast-001",
  fullName: "Sara Ahmed",
  email: "sara.ahmed@icare-cvd.com",
  phone: "+20 100 234 5678",
  avatarUrl: "https://i.pravatar.cc/400?u=sara-ahmed-care-assistant",
  role: "assistant",
  department: "Cardiology",
  experienceYears: 4,
  joinedAt: "2023-03-15T09:00:00Z",
}

export const MOCK_WORK_STATS: AssistantWorkStats = {
  patientsHandledToday: 12,
  appointmentsScheduled: 8,
  tasksCompleted: 23,
  queueManaged: 6,
}

export const MOCK_ACTIVITY_LOG: ActivityEntry[] = [
  {
    id: "act-1",
    action: "Added new patient",
    description: "Registered Mohamed Ali to the system",
    timestamp: "2026-05-06T10:30:00Z",
    type: "patient",
  },
  {
    id: "act-2",
    action: "Updated appointment status",
    description: "Changed appointment #2048 to Confirmed",
    timestamp: "2026-05-06T09:45:00Z",
    type: "appointment",
  },
  {
    id: "act-3",
    action: "Queue status changed",
    description: "Moved Fatma Hassan to In-Consultation",
    timestamp: "2026-05-06T09:15:00Z",
    type: "queue",
  },
  {
    id: "act-4",
    action: "Uploaded document",
    description: "Blood test results for Ahmed Sayed",
    timestamp: "2026-05-06T08:50:00Z",
    type: "document",
  },
  {
    id: "act-5",
    action: "Scheduled appointment",
    description: "New appointment for Youssef Ibrahim on May 10",
    timestamp: "2026-05-06T08:20:00Z",
    type: "appointment",
  },
  {
    id: "act-6",
    action: "Queue status changed",
    description: "Marked patient #107 as No-Show",
    timestamp: "2026-05-05T16:30:00Z",
    type: "queue",
  },
]

export const MOCK_SECURITY: SecurityInfo = {
  twoFactorEnabled: false,
  lastPasswordChange: "2026-04-12T09:00:00Z",
  activeSessions: 2,
  lastLogin: "2026-05-06T07:45:00Z",
}

export const MOCK_PREFERENCES: AssistantPreferences = {
  emergencyAlerts: true,
  appointmentReminders: true,
  checklistUpdates: true,
  doctorMessages: false,
  language: "en",
  theme: "light",
}

export const MOCK_WEEKLY_STATS: WeeklyStat[] = [
  { day: "Sat", patients: 10, appointments: 7, tasks: 18 },
  { day: "Sun", patients: 14, appointments: 9, tasks: 22 },
  { day: "Mon", patients: 8, appointments: 5, tasks: 15 },
  { day: "Tue", patients: 12, appointments: 8, tasks: 23 },
  { day: "Wed", patients: 16, appointments: 11, tasks: 28 },
  { day: "Thu", patients: 11, appointments: 6, tasks: 20 },
]

export const MOCK_SHIFT_SCHEDULE: ShiftEntry[] = [
  {
    id: "sh-1",
    dayName: "Sunday",
    dayBadge: "Su",
    timeRange: "9:00 AM — 5:00 PM",
    status: "active",
    note: "Main clinic · Dr. Khaled Mansour",
  },
  {
    id: "sh-2",
    dayName: "Monday",
    dayBadge: "Mo",
    timeRange: "9:00 AM — 5:00 PM",
    status: "active",
    note: "Main clinic · Dr. Khaled Mansour",
  },
  {
    id: "sh-3",
    dayName: "Tuesday",
    dayBadge: "Tu",
    timeRange: "9:00 AM — 5:00 PM",
    status: "active",
    note: "Main clinic · Dr. Khaled Mansour",
  },
  {
    id: "sh-4",
    dayName: "Wednesday",
    dayBadge: "We",
    timeRange: "9:00 AM — 2:00 PM",
    status: "half-day",
    note: "Half shift · Dr. Noha Samy",
  },
  {
    id: "sh-5",
    dayName: "Thursday",
    dayBadge: "Th",
    timeRange: null,
    status: "holiday",
    note: "Scheduled day off",
  },
]
