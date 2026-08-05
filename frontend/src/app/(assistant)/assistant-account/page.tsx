import type { Metadata } from "next"

import { AssistantAccountPageContainer } from "./AssistantAccountPageContainer"

export const metadata: Metadata = {
  title: "My account | ICARE-CVD",
  description: "Assistant profile, schedule, and activity.",
}

export default function AssistantAccountPage() {
  return <AssistantAccountPageContainer />
}
