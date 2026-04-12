import type { Metadata } from "next"

import { AddPatientPageContainer } from "./AddPatientPageContainer"

export const metadata: Metadata = {
  title: "Patients | ICARE-CVD",
  description: "Register and manage patient records.",
}

export default function AssistantPatientsPage() {
  return <AddPatientPageContainer />
}
