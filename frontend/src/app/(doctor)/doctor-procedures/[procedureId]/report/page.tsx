import type { Metadata } from "next"

import { DoctorProcedureReportPage } from "../../DoctorProcedureReportPage"

export const metadata: Metadata = {
  title: "Operation report | ICARE-CVD",
  description: "Write the post-operative clinical report for this procedure.",
}

type PageProps = {
  params: Promise<{ procedureId: string }>
}

export default async function DoctorProcedureReportRoute({ params }: PageProps) {
  const { procedureId } = await params
  return <DoctorProcedureReportPage procedureId={procedureId} />
}
