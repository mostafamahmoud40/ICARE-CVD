import { ConsultationReportRoute } from "./ConsultationReportRoute"

type PageProps = {
  params: Promise<{ patientId: string; visitId: string }>
}

export default async function ConsultationReportPageRoute({ params }: PageProps) {
  const { patientId, visitId } = await params
  return <ConsultationReportRoute patientId={patientId} visitId={visitId} />
}
