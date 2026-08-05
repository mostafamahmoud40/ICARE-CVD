import type { Metadata } from "next"

import { AssistantAccountSettingsContent } from "./AssistantAccountSettingsContent"

export const metadata: Metadata = {
  title: "Settings | ICARE-CVD",
  description: "Assistant security, notifications, and preferences.",
}

export default function AssistantAccountSettingsPage() {
  return <AssistantAccountSettingsContent />
}
