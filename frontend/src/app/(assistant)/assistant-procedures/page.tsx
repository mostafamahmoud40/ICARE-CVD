import type { Metadata } from "next"

import { AssistantProceduresPageContainer } from "./AssistantProceduresPageContainer"

export const metadata: Metadata = {
  title: "Procedure Orders | ICARE-CVD",
  description: "Manage pre-procedure tasks and requirements sent by doctors.",
}

export default function AssistantProceduresPage() {
  return <AssistantProceduresPageContainer />
}
