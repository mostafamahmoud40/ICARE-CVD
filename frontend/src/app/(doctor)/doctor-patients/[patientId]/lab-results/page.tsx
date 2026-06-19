import { LabResultsRoute } from "./LabResultsRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientLabResultsPage({ params }: PageProps) {
  const { patientId } = await params
  return <LabResultsRoute patientId={patientId} />
}
