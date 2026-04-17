"use client"

import React from "react"
import { DocumentsPage } from "./DocumentsPage"
import { mockDoctorPatientsData, mockPatientFullRecord } from "../../doctorPatients.mock"

export default function DocumentsRoutePage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = React.use(params)
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
    <DocumentsPage
      patientId={patientId}
      patientName={patient.fullName}
      documents={mockPatientFullRecord.documents}
    />
  )
}
