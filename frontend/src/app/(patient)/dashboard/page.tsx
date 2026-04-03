import type { Metadata } from "next"

import { PatientDashboard } from "./PatientDashboard"

export const metadata: Metadata = {
  title: "Patient Dashboard | ICARE-CVD",
  description: "Your personalized health overview.",
}

export default function PatientDashboardPage() {
  return <PatientDashboard />
}

