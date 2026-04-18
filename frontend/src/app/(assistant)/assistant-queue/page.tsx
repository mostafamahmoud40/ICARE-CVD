import type { Metadata } from "next"

import { AssistantQueuePageContainer } from "./AssistantQueuePageContainer"

export const metadata: Metadata = {
  title: "Patient Queue | ICARE-CVD",
  description: "Manage patient queue across all doctors.",
}

export default function AssistantQueuePage() {
  return <AssistantQueuePageContainer />
}
