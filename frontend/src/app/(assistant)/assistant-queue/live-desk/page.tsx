import type { Metadata } from "next"

import { AssistantQueuePageContainer } from "../AssistantQueuePageContainer"

export const metadata: Metadata = {
  title: "Live Desk | Patient Queue | ICARE-CVD",
  description: "Live patient queue and consultation pipeline.",
}

export default function AssistantQueueLiveDeskPage() {
  return <AssistantQueuePageContainer queueNavMode="operations" />
}
