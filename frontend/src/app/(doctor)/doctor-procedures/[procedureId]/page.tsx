import type { Metadata } from "next"

import { DoctorProcedureDetail } from "../DoctorProcedureDetail"

export const metadata: Metadata = {
  title: "Procedure detail | ICARE-CVD",
  description: "Review checklist readiness and physician directives for this procedure.",
}

type PageProps = {
  params: Promise<{ procedureId: string }>
}

export default async function DoctorProcedureDetailPage({ params }: PageProps) {
  const { procedureId } = await params
  return <DoctorProcedureDetail procedureId={procedureId} />
}
