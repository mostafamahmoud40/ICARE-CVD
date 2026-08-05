import type { Metadata } from "next"

import { DoctorPrescriptionsPatientDetail } from "../DoctorPrescriptionsPatientDetail"

export const metadata: Metadata = {
  title: "Patient prescriptions | ICARE-CVD",
  description: "Manage prescriptions and adherence for this patient.",
}

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function DoctorPrescriptionsPatientPage({ params }: PageProps) {
  const { patientId } = await params
  return <DoctorPrescriptionsPatientDetail patientId={patientId} />
}
