import type { Metadata } from "next"

import { AssistantAppointmentsPageContainer } from "./AssistantAppointmentsPageContainer"

export const metadata: Metadata = {
  title: "Appointments | ICARE-CVD",
  description: "Assistant appointments management and booking operations.",
}

export default function AssistantAppointmentsPage() {
  return <AssistantAppointmentsPageContainer />
}
