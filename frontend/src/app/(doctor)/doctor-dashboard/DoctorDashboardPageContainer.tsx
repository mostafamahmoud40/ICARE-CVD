"use client"

import { useDoctorDashboard } from "./useDoctorDashboard"
import { DoctorDashboard } from "./DoctorDashboard"

export function DoctorDashboardPageContainer() {
  const { data, isLoading, isError, error } = useDoctorDashboard()
  return <DoctorDashboard data={data} isLoading={isLoading} isError={isError} error={error} />
}
