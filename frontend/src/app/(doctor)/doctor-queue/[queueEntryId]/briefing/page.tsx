"use client"

import { use } from "react"
import { PatientBriefingPage } from "../consultation/PatientBriefingPage"

type PageProps = {
  params: Promise<{ queueEntryId: string }>
}

export default function BriefingRoutePage({ params }: PageProps) {
  const { queueEntryId } = use(params)
  return <PatientBriefingPage queueEntryId={queueEntryId} />
}
