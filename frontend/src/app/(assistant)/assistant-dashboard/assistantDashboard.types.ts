export type AssistantInfo = {
  id: string
  fullName: string
  department: string
  experienceYears: number
}

export type AssistantTask = {
  id: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed"
  dueAt: string
  assignedBy: string
}

export type AssignedCase = {
  id: string
  patientName: string
  patientId: string
  primaryDoctor: string
  condition: string
  assignedAt: string
  status: "active" | "monitoring" | "completed"
}

export type DoctorSupport = {
  id: string
  doctorName: string
  department: string
  supportType: "consultation" | "patient-monitoring" | "documentation" | "general"
  casesSupported: number
  lastInteraction: string
}

export type AssistantActivity = {
  id: string
  summary: string
  type: "task-completed" | "case-updated" | "support-provided" | "document-submitted"
  at: string
}

export type AssistantDashboardData = {
  assistant: AssistantInfo
  stats: {
    activeTasks: number
    assignedCases: number
    hoursThisWeek: number
    supportedDoctors: number
  }
  tasks: AssistantTask[]
  assignedCases: AssignedCase[]
  doctorSupport: DoctorSupport[]
  recentActivity: AssistantActivity[]
}
