import { DiagnosisDetailRoute } from "./DiagnosisDetailRoute"

type PageProps = {
  params: Promise<{ patientId: string; diagnosisId: string }>
}

export default async function PatientDiagnosisDetailPage({ params }: PageProps) {
  const { patientId, diagnosisId } = await params
  return <DiagnosisDetailRoute patientId={patientId} diagnosisId={diagnosisId} />
}
