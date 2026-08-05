"use client"

import { useAdminDashboard } from "./useAdminDashboard"
import { AdminDashboard } from "./AdminDashboard"

export function AdminDashboardPageContainer() {
  const { data, isLoading, isError, error } = useAdminDashboard()
  return (
    <AdminDashboard data={data} isLoading={isLoading} isError={isError} error={error} />
  )
}
