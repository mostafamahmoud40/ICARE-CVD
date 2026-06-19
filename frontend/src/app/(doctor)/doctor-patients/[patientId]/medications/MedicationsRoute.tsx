"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { MedicationsPage } from "./MedicationsPage"

export function MedicationsRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <MedicationsPage
          patientId={patientId}
          patientName={record.patient.fullName}
          medications={record.medications}
        />
      )}
    </DoctorPatientRecordShell>
  )
}
