import type { Metadata } from "next"

import { AssistantQueuePageContainer } from "../AssistantQueuePageContainer"

export const metadata: Metadata = {
  title: "Doctors | Patient Queue | ICARE-CVD",
  description: "Doctor check-in and queue attendance.",
}

export default function AssistantQueueDoctorsPage() {
  return <AssistantQueuePageContainer queueNavMode="doctors" />
}
