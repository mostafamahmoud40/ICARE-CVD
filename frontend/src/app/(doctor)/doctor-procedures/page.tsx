import type { Metadata } from "next"

import { DoctorProceduresList } from "./DoctorProceduresList"

export const metadata: Metadata = {
  title: "Procedures | ICARE-CVD",
  description: "Review pre-op readiness and sign off clinical procedures.",
}

export default function DoctorProceduresPage() {
  return <DoctorProceduresList />
}
