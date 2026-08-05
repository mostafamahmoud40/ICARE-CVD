import { DiagnosesRoute } from "./DiagnosesRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientDiagnosesPage({ params }: PageProps) {
  const { patientId } = await params
  return <DiagnosesRoute patientId={patientId} />
}
