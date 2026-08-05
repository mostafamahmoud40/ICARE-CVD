import type { Metadata } from "next"

import { AssistantDashboardPageContainer } from "./AssistantDashboardPageContainer"

export const metadata: Metadata = {
  title: "Today's Command Center | ICARE-CVD",
  description: "Live reception queue, upcoming appointments, and urgent triage desk.",
}

export default function AssistantDashboardPage() {
  return <AssistantDashboardPageContainer />
}
