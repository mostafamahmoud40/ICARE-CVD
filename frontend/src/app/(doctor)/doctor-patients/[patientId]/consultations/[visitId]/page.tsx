"use client"

import { useParams } from "next/navigation"
import { ConsultationReportPage } from "./ConsultationReportPage"
import { mockDoctorPatientsData, mockPatientFullRecord, mockConsultationReports } from "../../../doctorPatients.mock"

export default function ConsultationReportRoute() {
  const { patientId = "", visitId = "" } = useParams<{ patientId: string; visitId: string }>()
  const patient = mockDoctorPatientsData.patients.find((p) => p.id === patientId)
  const report = mockConsultationReports[visitId]

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

  if (!report) {
    const visit = mockPatientFullRecord.visits.find((v) => v.id === visitId)
    if (!visit) {
      return (
        <main className="flex flex-1 items-center justify-center bg-[#F9F8F5]">
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[#102F27]">Report not found</p>
            <p className="mt-1 text-[12px] text-muted-foreground">No detailed report available for this consultation.</p>
          </div>
        </main>
      )
    }
  }

  return (
    <ConsultationReportPage
      patientId={patientId}
      patientName={patient.fullName}
      report={report}
    />
  )
}
