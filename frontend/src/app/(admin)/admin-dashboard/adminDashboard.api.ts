import { apiClient } from "@/lib/api-client"
import type { AdminDashboardData } from "./adminDashboard.types"

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await apiClient.get<AdminDashboardData>("/admin/dashboard")
  return data
}
