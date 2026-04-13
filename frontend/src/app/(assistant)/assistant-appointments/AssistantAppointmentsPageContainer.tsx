"use client"

import { AssistantAppointments } from "./AssistantAppointments"
import { useAssistantAppointments } from "./useAssistantAppointments"

export function AssistantAppointmentsPageContainer() {
  const state = useAssistantAppointments()
  return <AssistantAppointments {...state} />
}
