import type { Metadata } from "next"

import { AssistantDashboardPageContainer } from "./AssistantDashboardPageContainer"

export const metadata: Metadata = {
  title: "Assistant Dashboard | ICARE-CVD",
  description: "Your assistant overview and task management.",
}

export default function AssistantDashboardPage() {
  return <AssistantDashboardPageContainer />
}
