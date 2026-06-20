"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { DocumentsPage } from "./DocumentsPage"

export function DocumentsRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <DocumentsPage patient={record.patient} documents={record.documents} />
      )}
    </DoctorPatientRecordShell>
  )
}
