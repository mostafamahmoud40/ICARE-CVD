import type { Metadata } from "next"

import { DoctorProceduresPending } from "../DoctorProceduresPending"

export const metadata: Metadata = {
  title: "Pending procedures | ICARE-CVD",
  description: "Review pre-op progress and sign off procedure clearance.",
}

export default function DoctorProceduresPendingPage() {
  return <DoctorProceduresPending />
}
