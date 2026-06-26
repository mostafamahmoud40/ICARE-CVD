"use client"

import { AssistantPatientProfilePage } from "./AssistantPatientProfilePage"
import { useAssistantPatientProfilePage } from "./useAssistantPatientProfilePage"

type AssistantPatientProfilePageContainerProps = {
  patientId: string
}

export function AssistantPatientProfilePageContainer({
  patientId,
}: AssistantPatientProfilePageContainerProps) {
  const state = useAssistantPatientProfilePage({ routePatientId: patientId })
  return <AssistantPatientProfilePage {...state} />
}
