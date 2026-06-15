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

/** Reference date for mock activity timestamps (matches app demo timeline). */
const MOCK_ACTIVITY_NOW = new Date("2026-06-13T12:00:00Z")

function mockActivityTimestamp(daysAgo: number, hour = 10, minute = 0) {
  const date = new Date(MOCK_ACTIVITY_NOW)
  date.setUTCDate(date.getUTCDate() - daysAgo)
  date.setUTCHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const MOCK_ACTIVITY_LOG: ActivityEntry[] = [
  {
    id: "act-1",
    action: "Added new patient",
    description: "Registered Mohamed Ali to the system",
    timestamp: mockActivityTimestamp(0, 10, 30),
    type: "patient",
  },
  {
    id: "act-2",
    action: "Updated appointment status",
    description: "Changed appointment #2048 to Confirmed",
    timestamp: mockActivityTimestamp(0, 9, 45),
    type: "appointment",
  },
  {
    id: "act-3",
    action: "Queue status changed",
    description: "Moved Fatma Hassan to In-Consultation",
    timestamp: mockActivityTimestamp(0, 9, 15),
    type: "queue",
  },
  {
    id: "act-4",
    action: "Uploaded document",
    description: "Blood test results for Ahmed Sayed",
    timestamp: mockActivityTimestamp(0, 8, 50),
    type: "document",
  },
  {
    id: "act-5",
    action: "Scheduled appointment",
    description: "New appointment for Youssef Ibrahim on Jun 18",
    timestamp: mockActivityTimestamp(0, 8, 20),
    type: "appointment",
  },
  {
    id: "act-6",
    action: "Queue status changed",
    description: "Marked patient #107 as No-Show",
    timestamp: mockActivityTimestamp(1, 16, 30),
    type: "queue",
  },
  {
    id: "act-7",
    action: "Added new patient",
    description: "Registered Noura Hamed after walk-in intake",
    timestamp: mockActivityTimestamp(2, 11, 10),
    type: "patient",
  },
  {
    id: "act-8",
    action: "Uploaded document",
    description: "ECG report attached for Karim Tarek",
    timestamp: mockActivityTimestamp(3, 14, 5),
    type: "document",
  },
  {
    id: "act-9",
    action: "Scheduled appointment",
    description: "Follow-up booked for Layla Mostafa with Dr. Sarah",
    timestamp: mockActivityTimestamp(4, 10, 0),
    type: "appointment",
  },
  {
    id: "act-10",
    action: "Queue status changed",
    description: "Moved Omar Said from Waiting to Ready",
    timestamp: mockActivityTimestamp(5, 9, 40),
    type: "queue",
  },
  {
    id: "act-11",
    action: "Added new patient",
    description: "Registered Hana Fouad from referral form",
    timestamp: mockActivityTimestamp(8, 13, 20),
    type: "patient",
  },
  {
    id: "act-12",
    action: "Updated appointment status",
    description: "Cancelled appointment #2091 — patient requested reschedule",
    timestamp: mockActivityTimestamp(12, 15, 55),
    type: "appointment",
  },
  {
    id: "act-13",
    action: "Uploaded document",
    description: "Holter monitor summary for Youssef Ibrahim",
    timestamp: mockActivityTimestamp(18, 11, 35),
    type: "document",
  },
  {
    id: "act-14",
    action: "Queue status changed",
    description: "Closed queue entry for completed visit #884",
    timestamp: mockActivityTimestamp(22, 17, 10),
    type: "queue",
  },
  {
    id: "act-15",
    action: "Scheduled appointment",
    description: "Pre-procedure slot for Ahmed Sayed on Jul 2",
    timestamp: mockActivityTimestamp(28, 10, 15),
    type: "appointment",
  },
  {
    id: "act-16",
    action: "Added new patient",
    description: "Registered Sami Khalil from insurance portal import",
    timestamp: mockActivityTimestamp(35, 9, 5),
    type: "patient",
  },
  {
    id: "act-17",
    action: "Uploaded document",
    description: "Discharge summary filed for Fatma Hassan",
    timestamp: mockActivityTimestamp(48, 16, 45),
    type: "document",
  },
  {
    id: "act-18",
    action: "Queue status changed",
    description: "Escalated long-wait patient #119 to duty doctor",
    timestamp: mockActivityTimestamp(62, 12, 30),
    type: "queue",
  },
  {
    id: "act-19",
    action: "Updated appointment status",
    description: "Marked appointment #1988 as Completed",
    timestamp: mockActivityTimestamp(75, 14, 0),
    type: "appointment",
  },
  {
    id: "act-20",
    action: "Added new patient",
    description: "Registered Rania Adel during cardiology screening day",
    timestamp: mockActivityTimestamp(95, 11, 50),
    type: "patient",
  },
  {
    id: "act-21",
    action: "Scheduled appointment",
    description: "Annual review booked for Mohamed Ali in March",
    timestamp: mockActivityTimestamp(120, 10, 25),
    type: "appointment",
  },
  {
    id: "act-22",
    action: "Uploaded document",
    description: "Lab panel uploaded for Noura Hamed",
    timestamp: mockActivityTimestamp(145, 9, 35),
    type: "document",
  },
  {
    id: "act-23",
    action: "Queue status changed",
    description: "Reopened no-show slot for same-day callback list",
    timestamp: mockActivityTimestamp(180, 15, 20),
    type: "queue",
  },
  {
    id: "act-24",
    action: "Added new patient",
    description: "Registered Tarek Nabil from community outreach clinic",
    timestamp: mockActivityTimestamp(220, 13, 0),
    type: "patient",
  },
  {
    id: "act-25",
    action: "Updated appointment status",
    description: "Confirmed batch of 6 follow-up appointments for Q1",
    timestamp: mockActivityTimestamp(280, 10, 40),
    type: "appointment",
  },
  {
    id: "act-26",
    action: "Uploaded document",
    description: "Archived imaging report set for Karim Tarek",
    timestamp: mockActivityTimestamp(320, 16, 15),
    type: "document",
  },
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

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
