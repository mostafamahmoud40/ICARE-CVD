import { redirect } from "next/navigation"

type PageProps = {
  params: Promise<{ assistantUserId: string }>
}

export default async function DoctorAssistantShiftsRedirectPage({ params }: PageProps) {
  const { assistantUserId } = await params
  redirect(`/doctor-assistants/schedule?assistant=${assistantUserId}`)
}
