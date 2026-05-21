import type { Metadata } from "next"

import { AssistantQueuePageContainer } from "../AssistantQueuePageContainer"

export const metadata: Metadata = {
  title: "Past Visits | Patient Queue | ICARE-CVD",
  description: "Completed and no-show visits.",
}

export default function AssistantQueueHistoryPage() {
  return <AssistantQueuePageContainer queueNavMode="history" />
}
