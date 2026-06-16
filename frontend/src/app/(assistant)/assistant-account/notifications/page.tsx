import type { Metadata } from "next"

import { AssistantNotificationsPage } from "../../assistant-notifications/AssistantNotificationsPage"

export const metadata: Metadata = {
  title: "Notifications | ICARE-CVD",
  description: "Assistant notifications and clinical desk alerts.",
}

export default function AssistantAccountNotificationsPage() {
  return <AssistantNotificationsPage />
}
