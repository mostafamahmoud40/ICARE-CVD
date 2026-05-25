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
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#F4F3EF] animate-in fade-in duration-500">
      <VisitDetail visit={visit} />
    </div>
  )
}
