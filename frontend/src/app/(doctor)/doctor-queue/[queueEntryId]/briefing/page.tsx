import { PatientBriefingPage } from "../consultation/PatientBriefingPage"

type PageProps = {
  params: Promise<{ queueEntryId: string }>
}

export default async function BriefingRoutePage({ params }: PageProps) {
  const { queueEntryId } = await params
  return <PatientBriefingPage queueEntryId={queueEntryId} />
}
