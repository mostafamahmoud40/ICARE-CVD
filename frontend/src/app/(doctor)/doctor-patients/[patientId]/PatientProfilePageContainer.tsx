"use client"

import { DoctorPatientRecordShell } from "../DoctorPatientRecordShell"
import { PatientProfileWithRecord } from "./PatientProfileWithRecord"

export function PatientProfilePageContainer({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => <PatientProfileWithRecord record={record} />}
    </DoctorPatientRecordShell>
  )
}
