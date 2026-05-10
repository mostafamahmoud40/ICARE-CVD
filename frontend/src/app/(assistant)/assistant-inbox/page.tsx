import type { Metadata } from "next"

import { InboxPageContainer } from "./InboxPageContainer"

export const metadata: Metadata = {
  title: "Inbox | ICARE-CVD",
  description: "Manage your messages and notifications.",
}

export default function AssistantInboxPage() {
  return <InboxPageContainer />
}
