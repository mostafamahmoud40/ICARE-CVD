import type { Metadata } from "next"

import { VisitDetailContent } from "./VisitDetailContent"

export const metadata: Metadata = {
  title: "Visit Details | ICARE-CVD",
  description: "View detailed consultation summary.",
}

export default function VisitDetailPage() {
  return <VisitDetailContent />
}

