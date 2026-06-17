import type { Metadata } from "next"

import { DoctorProceduresCalendar } from "../DoctorProceduresCalendar"

export const metadata: Metadata = {
  title: "Procedure calendar | ICARE-CVD",
  description: "Weekly calendar of scheduled clinical procedures.",
}

export default function DoctorProceduresCalendarPage() {
  return <DoctorProceduresCalendar />
}
