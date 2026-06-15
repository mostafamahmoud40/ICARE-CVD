"use client"

import { use } from "react"
import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { DiagnosesPage } from "./DiagnosesPage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function PatientDiagnosesPage({ params }: PageProps) {
  const { patientId } = use(params)

  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <DiagnosesPage patient={record.patient} diagnoses={record.diagnoses} />
      )}
    </DoctorPatientRecordShell>
  )
}
