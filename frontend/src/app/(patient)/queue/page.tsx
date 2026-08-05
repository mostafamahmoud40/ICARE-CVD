import type { Metadata } from "next"

import { PatientQueuePageContainer } from "./PatientQueuePageContainer"

export const metadata: Metadata = {
  title: "Clinic Queue | ICARE-CVD",
  description: "See your wait status for today's clinic visit.",
}

export default function PatientQueuePage() {
  return <PatientQueuePageContainer />
}
