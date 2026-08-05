import type { Metadata } from "next"

import { DoctorProceduresCompleted } from "../DoctorProceduresCompleted"

export const metadata: Metadata = {
  title: "Completed procedures | ICARE-CVD",
  description: "Verified procedures and post-operative reports.",
}

export default function DoctorProceduresCompletedPage() {
  return <DoctorProceduresCompleted />
}
