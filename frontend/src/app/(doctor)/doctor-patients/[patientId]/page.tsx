import { PatientProfilePageContainer } from "./PatientProfilePageContainer"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { patientId } = await params
  return <PatientProfilePageContainer patientId={patientId} />
}
