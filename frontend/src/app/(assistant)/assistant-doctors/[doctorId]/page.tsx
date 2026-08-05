import { AssistantDoctorClinicProfilePage } from "./AssistantDoctorClinicProfilePage"

type PageProps = {
  params: Promise<{ doctorId: string }>
}

export default async function AssistantDoctorClinicProfileRoute({ params }: PageProps) {
  const { doctorId } = await params
  return <AssistantDoctorClinicProfilePage doctorId={doctorId} />
}
