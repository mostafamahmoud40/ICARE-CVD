import type { Metadata } from "next"

import { DoctorAssistantsPageContainer } from "./DoctorAssistantsPageContainer"

export const metadata: Metadata = {
  title: "My Assistants | ICARE-CVD",
  description: "Manage clinic assistants linked to your doctor account.",
}

export default function DoctorAssistantsPage() {
  return <DoctorAssistantsPageContainer />
}
