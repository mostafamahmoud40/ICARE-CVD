"use client"

import { use } from "react"
import { PatientProfile } from "./PatientProfile"
import { DoctorPatientRecordShell } from "../DoctorPatientRecordShell"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default function PatientDetailPage({ params }: PageProps) {
  const { patientId } = use(params)

  return (
    <DoctorPatientRecordShell patientId={patientId}>
      {(record) => <PatientProfile record={record} />}
    </DoctorPatientRecordShell>
  )
}
