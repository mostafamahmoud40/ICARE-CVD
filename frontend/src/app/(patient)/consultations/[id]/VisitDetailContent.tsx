"use client"

import { notFound } from "next/navigation"

import { VisitDetail } from "../VisitDetail"
import { usePatientConsultation } from "../usePatientConsultations"

type VisitDetailContentProps = {
  visitId: string
}

export function VisitDetailContent({ visitId }: VisitDetailContentProps) {
  const { data: visit, isLoading, isError } = usePatientConsultation(visitId)

  if (isLoading) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col items-center justify-center overflow-hidden bg-[#F4F3EF]">
        <p className="text-[14px] font-medium text-muted-foreground">Loading visit summary…</p>
      </div>
    )
  }

  if (isError || !visit) {
    notFound()
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-[#F4F3EF] animate-in fade-in duration-500">
      <VisitDetail visit={visit} />
    </div>
  )
}
