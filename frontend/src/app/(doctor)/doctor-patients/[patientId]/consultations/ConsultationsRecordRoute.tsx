"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { ConsultationsPage } from "./ConsultationsPage"

export function ConsultationsRecordRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <ConsultationsPage
          patientId={patientId}
          patientName={record.patient.fullName}
          visits={record.visits}
        />
      )}
    </DoctorPatientRecordShell>
  )
}
