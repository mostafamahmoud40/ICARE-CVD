import type { Metadata } from "next"

import { VisitDetailContent } from "./VisitDetailContent"

export const metadata: Metadata = {
  title: "Visit Details | ICARE-CVD",
  description: "View detailed consultation summary.",
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function VisitDetailPage({ params }: PageProps) {
  const { id } = await params
  return <VisitDetailContent visitId={id} />
}

