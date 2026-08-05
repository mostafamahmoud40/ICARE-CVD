import type { Metadata } from "next"

import { AssistantActivityLogPage } from "../AssistantActivityLogPage"
import { MOCK_ACTIVITY_LOG } from "../assistantAccount.mock"

export const metadata: Metadata = {
  title: "Activity log | ICARE-CVD",
  description: "Full assistant activity history with period filters.",
}

export default function AssistantAccountActivityPage() {
  return <AssistantActivityLogPage activities={MOCK_ACTIVITY_LOG} />
}
