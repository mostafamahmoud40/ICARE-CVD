"use client"

import { use } from "react"
import { VitalsPage } from "./VitalsPage"
import { mockDoctorPatientsData, mockPatientFullRecord } from "../../doctorPatients.mock"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function VitalsPageRoute({ params }: PageProps) {
  const { patientId } = use(params)
  const patient = mockDoctorPatientsData.patients.find((p) => p.id === patientId)

  if (!patient) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#102F27]">Patient not found</p>
          <p className="mt-1 text-[12px] text-muted-foreground">ID: {patientId}</p>
        </div>
      </main>
    )
  }

  return (
    <VitalsPage
      patientId={patientId}
      patientName={patient.fullName}
      latestVitals={mockPatientFullRecord.latestVitals}
      vitalReadings={mockPatientFullRecord.vitalReadings}
    />
  )
}
