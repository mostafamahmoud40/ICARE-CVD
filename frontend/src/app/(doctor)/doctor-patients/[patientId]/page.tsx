import { PatientProfileRoute } from "./PatientProfileRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { patientId } = await params
  return <PatientProfileRoute patientId={patientId} />
}
