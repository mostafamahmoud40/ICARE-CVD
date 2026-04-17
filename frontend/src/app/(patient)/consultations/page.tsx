import type { Metadata } from "next"

import { ConsultationsContent } from "./ConsultationsContent"
import { mockVisitData, mockStats } from "./consultations.mock"

export const metadata: Metadata = {
  title: "Consultations | ICARE-CVD",
  description: "View your visit summaries and consultation history.",
}

export default function ConsultationsPage() {
  return <ConsultationsContent visits={mockVisitData.visits} stats={mockStats} />
}
