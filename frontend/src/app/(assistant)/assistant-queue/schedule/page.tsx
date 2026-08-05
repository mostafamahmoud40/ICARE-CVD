import type { Metadata } from "next"

import { AssistantQueuePageContainer } from "../AssistantQueuePageContainer"

export const metadata: Metadata = {
  title: "Expected Today | Patient Queue | ICARE-CVD",
  description: "Scheduled patients expected to arrive today.",
}

export default function AssistantQueueSchedulePage() {
  return <AssistantQueuePageContainer queueNavMode="schedule" />
}
