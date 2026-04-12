import type { Metadata } from "next"

import { Appointments } from "./Appointments"

export const metadata: Metadata = {
  title: "Appointments | ICARE-CVD",
  description: "View and manage your appointments.",
}

export default function AppointmentsPage() {
  return <Appointments />
}
