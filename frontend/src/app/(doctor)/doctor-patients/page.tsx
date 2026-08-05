"use client"

import { DoctorPatients } from "./DoctorPatients"
import { useDoctorPatients } from "./useDoctorPatients"

export default function DoctorPatientsPage() {
  const { patients, stats, isLoading, isError } = useDoctorPatients()

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[13px] font-medium text-muted-foreground">Loading patients…</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <p className="text-[14px] font-semibold text-[#102F27]">Unable to load patients</p>
      </main>
    )
  }

  return <DoctorPatients patients={patients} stats={stats} />
}
