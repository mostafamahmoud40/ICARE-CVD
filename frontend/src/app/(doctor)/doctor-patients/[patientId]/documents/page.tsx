"use client"

import { use } from "react"
import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { DocumentsPage } from "./DocumentsPage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function PatientDocumentsPage({ params }: PageProps) {
  const { patientId } = use(params)

  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <DocumentsPage patient={record.patient} documents={record.documents} />
      )}
    </DoctorPatientRecordShell>
  )
}
