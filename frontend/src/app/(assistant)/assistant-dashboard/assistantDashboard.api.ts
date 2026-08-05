import { fetchAssistantAccount } from "../assistant-account/assistantAccount.api"
import type { AssistantDashboardData } from "./assistantDashboard.types"

export async function fetchAssistantDashboard(): Promise<AssistantDashboardData> {
  const account = await fetchAssistantAccount()

  return {
    assistant: {
      id: account.profile.id,
      fullName: account.profile.fullName,
      department: account.profile.department,
      experienceYears: account.profile.experienceYears,
    },
    stats: {
      activeTasks: 0,
      assignedCases: 0,
      hoursThisWeek: 0,
      supportedDoctors: 0,
    },
    tasks: [],
    assignedCases: [],
    doctorSupport: [],
    recentActivity: [],
  }
}
