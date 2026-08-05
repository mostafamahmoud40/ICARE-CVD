"use client"

import { use } from "react"
import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { LabResultsPage } from "./LabResultsPage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function PatientLabResultsPage({ params }: PageProps) {
  const { patientId } = use(params)

  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <LabResultsPage patient={record.patient} labResults={record.labResults} />
      )}
    </DoctorPatientRecordShell>
  )
}
