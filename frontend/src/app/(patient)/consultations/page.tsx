import type { Metadata } from "next"

import { ConsultationsPageClient } from "./ConsultationsPageClient"

export const metadata: Metadata = {
  title: "Consultations | ICARE-CVD",
  description: "View your visit summaries and consultation history.",
}

export default function ConsultationsPage() {
  return <ConsultationsPageClient />
}
