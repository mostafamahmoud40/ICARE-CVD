"use client"

import { usePatientDashboard } from "./usePatientDashboard"
import { PatientDashboard } from "./PatientDashboard"

export function PatientDashboardPageContainer() {
  const { data, isLoading, isError, error } = usePatientDashboard()
  return <PatientDashboard data={data} isLoading={isLoading} isError={isError} error={error} />
}
