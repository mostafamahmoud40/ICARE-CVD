import { MedicationDetailRoute } from "./MedicationDetailRoute"

type PageProps = {
  params: Promise<{ patientId: string; medId: string }>
}

export default async function MedicationDetailPage({ params }: PageProps) {
  const { patientId, medId } = await params
  return <MedicationDetailRoute patientId={patientId} medicationId={medId} />
}
