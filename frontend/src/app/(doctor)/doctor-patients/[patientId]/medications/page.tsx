import { MedicationsRoute } from "./MedicationsRoute"

type PageProps = {
  params: Promise<{ patientId: string }>
}

export default async function MedicationsRoutePage({ params }: PageProps) {
  const { patientId } = await params
  return <MedicationsRoute patientId={patientId} />
}
