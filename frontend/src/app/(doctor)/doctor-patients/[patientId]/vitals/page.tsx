"use client"

import { use } from "react"
import { DoctorPatientRecordShell } from "../../DoctorPatientRecordShell"
import { VitalsPage } from "./VitalsPage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function PatientVitalsPage({ params }: PageProps) {
  const { patientId } = use(params)

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
