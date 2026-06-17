import type { Metadata } from "next"

import { AssistantProcedureReportPage } from "@/app/(assistant)/assistant-procedures/AssistantProcedureReportPage"

export const metadata: Metadata = {
  title: "Procedure report | ICARE-CVD",
  description: "Procedure report details and checklist summary.",
}

type PageProps = {
  params: Promise<{ procedureId: string }>
}

export default async function AssistantProcedureReportRoute({ params }: PageProps) {
  const { procedureId } = await params
  return <AssistantProcedureReportPage procedureId={procedureId} />
}
