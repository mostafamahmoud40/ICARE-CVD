import type { Metadata } from "next";

import { AssistantMedicationsPatientDetail } from "../AssistantMedicationsPatientDetail";

export const metadata: Metadata = {
  title: "Patient medications | ICARE-CVD",
  description: "Medication adherence, flags, and follow-up for this patient.",
};

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function AssistantMedicationsPatientPage({ params }: PageProps) {
  const { patientId } = await params
  return <AssistantMedicationsPatientDetail patientId={patientId} />
}
