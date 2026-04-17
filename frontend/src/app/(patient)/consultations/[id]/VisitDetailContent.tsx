"use client"

import { useParams } from "next/navigation"
import { notFound } from "next/navigation"

import { VisitDetail } from "../VisitDetail"
import { getVisitById } from "../consultations.mock"

export function VisitDetailContent() {
  const params = useParams()
  const id = params.id as string

  const visit = getVisitById(id)

  if (!visit) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <VisitDetail visit={visit} />
    </div>
  )
}
