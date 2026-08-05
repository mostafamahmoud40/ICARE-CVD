import { VitalsRoute } from "./VitalsRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientVitalsPage({ params }: PageProps) {
  const { patientId } = await params
  return <VitalsRoute patientId={patientId} />
}
