import type { Metadata } from "next"

import { PatientDashboardPageContainer } from "./PatientDashboardPageContainer"

export const metadata: Metadata = {
  title: "Patient Dashboard | ICARE-CVD",
  description: "Your personalized health overview.",
}

export default function PatientDashboardPage() {
  return <PatientDashboardPageContainer />
}


