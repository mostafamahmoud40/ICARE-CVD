"use client"

import { DoctorPatientRecordShell } from "../DoctorPatientRecordShell"
import { PatientProfile } from "./PatientProfile"

export function PatientProfileRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => <PatientProfile record={record} />}
    </DoctorPatientRecordShell>
  )
}
