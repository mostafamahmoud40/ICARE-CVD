import { AssistantPatientProfilePage } from "./AssistantPatientProfilePage"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function AssistantPatientProfileRoute({ params }: PageProps) {
  const { patientId } = await params
  return <AssistantPatientProfilePage patientId={patientId} />
}
