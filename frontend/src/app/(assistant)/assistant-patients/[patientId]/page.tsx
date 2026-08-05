import { AssistantPatientProfilePageContainer } from "./AssistantPatientProfilePageContainer"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function AssistantPatientProfileRoute({ params }: PageProps) {
  const { patientId } = await params
  return <AssistantPatientProfilePageContainer patientId={patientId} />
}
