import type { Metadata } from "next"

import { AssistantMedicationsPageContainer } from "./AssistantMedicationsPageContainer"

export const metadata: Metadata = {
  title: "Medication adherence | ICARE-CVD",
  description: "Monitor patient medications, adherence, flags, and reminders.",
}

export default function AssistantMedicationsPage() {
  return <AssistantMedicationsPageContainer />
}
