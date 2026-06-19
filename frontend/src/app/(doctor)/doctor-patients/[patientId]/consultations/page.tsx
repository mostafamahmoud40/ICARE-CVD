import { ConsultationsRecordRoute } from "./ConsultationsRecordRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function ConsultationsRoutePage({ params }: PageProps) {
  const { patientId } = await params
  return <ConsultationsRecordRoute patientId={patientId} />
}
