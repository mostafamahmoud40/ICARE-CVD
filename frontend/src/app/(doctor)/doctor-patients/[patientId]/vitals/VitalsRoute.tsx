"use client"

import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { VitalsPage } from "./VitalsPage"

export function VitalsRoute({ patientId }: { patientId: string }) {
  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => (
        <VitalsPage
          patient={record.patient}
          latestVitals={record.latestVitals}
          vitalReadings={record.vitalReadings}
        />
      )}
    </DoctorPatientRecordShell>
  )
}
