"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { DiagnosesPage } from "./DiagnosesPage"

export function DiagnosesRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <DiagnosesPage patient={record.patient} diagnoses={record.diagnoses} />
      )}
    </DoctorPatientRecordShell>
  )
}
