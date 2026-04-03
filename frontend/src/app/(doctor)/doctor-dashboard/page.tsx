import type { Metadata } from "next"

import { DoctorDashboard } from "./DoctorDashboard"

export const metadata: Metadata = {
  title: "Doctor Dashboard | ICARE-CVD",
  description: "Your doctor-focused overview.",
}

export default function DoctorDashboardPage() {
  return <DoctorDashboard />
}

