import type { Metadata } from "next"

import { DoctorDashboardPageContainer } from "./DoctorDashboardPageContainer"

export const metadata: Metadata = {
  title: "Doctor Dashboard | ICARE-CVD",
  description: "Your doctor-focused overview.",
}

export default function DoctorDashboardPage() {
  return <DoctorDashboardPageContainer />
}


