"use client"

import { useAssistantDashboard } from "./useAssistantDashboard"
import { AssistantDashboard } from "./AssistantDashboard"

export function AssistantDashboardPageContainer() {
  const { data, isLoading, isError, error } = useAssistantDashboard()
  return (
    <AssistantDashboard data={data} isLoading={isLoading} isError={isError} error={error} />
  )
}
