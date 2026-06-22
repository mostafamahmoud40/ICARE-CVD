export type AdminUser = {
  id: string
  fullName: string
  email: string
  role: "patient" | "doctor" | "assistant" | "admin"
  status: "active" | "pending" | "suspended"
  joinedAt: string
}

export type AdminActivity = {
  id: string
  summary: string
  actor: string
  at: string
}

export type AdminDashboardData = {
  admin: {
    fullName: string
    email: string
  }
  counts: {
    totalUsers: number
    doctors: number
    patients: number
    pendingVerifications: number
  }
  recentSignups: AdminUser[]
  recentActivity: AdminActivity[]
}
