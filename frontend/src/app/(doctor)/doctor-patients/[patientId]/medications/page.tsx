"use client"

import { useParams } from "next/navigation"
import { MedicationsPage } from "./MedicationsPage"
import { mockDoctorPatientsData, mockPatientFullRecord } from "../../doctorPatients.mock"

export default function MedicationsRoutePage() {
  const { patientId = "" } = useParams<{ patientId: string }>()
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
    <MedicationsPage
      patientId={patientId}
      patientName={patient.fullName}
      medications={mockPatientFullRecord.medications}
    />
  )
}
