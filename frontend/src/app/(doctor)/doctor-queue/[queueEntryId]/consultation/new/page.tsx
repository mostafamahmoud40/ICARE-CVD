"use client"

import { use } from "react"
import { ConsultationPage } from "../ConsultationPage"

type PageProps = {
  params: Promise<{ queueEntryId: string }>
}

export default function NewConsultationPage({ params }: PageProps) {
  use(params)
  return <ConsultationPage />
}
