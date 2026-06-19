"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { LabResultsPage } from "./LabResultsPage"

export function LabResultsRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <LabResultsPage
          patient={record.patient}
          labResults={record.labResults}
          documents={record.documents}
        />
      )}
    </DoctorPatientRecordShell>
  )
}
