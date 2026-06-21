"use client"

import { use } from "react"

import { AssistantPatientProfilePage } from "./AssistantPatientProfilePage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function AssistantPatientProfileRoute({ params }: PageProps) {
  const { patientId } = use(params)
  return <AssistantPatientProfilePage patientId={patientId} />
}
