"use client"

import type { ReactNode } from "react"
import { useDoctorPatientRecord } from "./useDoctorPatientRecord"
import type { PatientFullRecord } from "./doctorPatients.types"

export function DoctorPatientRecordShell({
  patientId,
  children,
}: {
  patientId: string
  children: (record: PatientFullRecord) => ReactNode
}) {
  const { data, isLoading, isError } = useDoctorPatientRecord(patientId)

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[13px] font-medium text-muted-foreground">Loading patient record…</p>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#102F27]">Patient not found</p>
          <p className="mt-1 text-[12px] text-muted-foreground">ID: {patientId}</p>
        </div>
      </main>
    )
  }

  return <>{children(data)}</>
}
