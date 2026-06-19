import { DocumentsRoute } from "./DocumentsRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function PatientDocumentsPage({ params }: PageProps) {
  const { patientId } = await params
  return <DocumentsRoute patientId={patientId} />
}
