import { ConsultationPage } from "../ConsultationPage"

type PageProps = {
  params: Promise<{ queueEntryId: string }>
}

export default async function NewConsultationPage({ params }: PageProps) {
  const { queueEntryId } = await params
  return <ConsultationPage queueEntryId={queueEntryId} />
}
