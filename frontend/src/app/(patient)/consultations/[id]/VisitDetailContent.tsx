"use client"

import { notFound } from "next/navigation"

import { VisitDetail } from "../VisitDetail"
import { getVisitById } from "../consultations.mock"

type VisitDetailContentProps = {
  visitId: string
}

export function VisitDetailContent({ visitId }: VisitDetailContentProps) {
  const visit = getVisitById(visitId)

  if (!visit) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <VisitDetail visit={visit} />
    </div>
  )
}
