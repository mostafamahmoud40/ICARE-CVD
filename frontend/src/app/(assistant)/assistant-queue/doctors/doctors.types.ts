export type DoctorQueueState = "idle" | "checkedIn" | "scheduled" | "active" | "paused"

export type DoctorStatus = {
  id: string
  name: string
  department: string
  room: string
  checkedInAt: string | null
  queueStartAt: string | null
  isPaused: boolean
  pausedAt: string | null
  avatarSeed?: string
  queueCount?: number
}

export type ActivityLog = {
  id: string
  doctorId: string
  action: "check-in" | "check-out" | "pause" | "resume" | "set-time"
  timestamp: string
  details?: string
}

export type AttendanceLog = {
  id: string
  doctorId: string
  date: string
  checkIn: string
  checkOut: string | null
  duration: string | null
  status: "completed" | "active"
}
