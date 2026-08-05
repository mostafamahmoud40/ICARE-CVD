import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { parseQueueNavMode, queueRouteForMode } from "./queueNavMode"

export const metadata: Metadata = {
  title: "Patient Queue | ICARE-CVD",
  description: "Manage patient queue across all doctors.",
}

type AssistantQueuePageProps = {
  searchParams: Promise<{ view?: string }>
}

export default async function AssistantQueuePage({ searchParams }: AssistantQueuePageProps) {
  const { view } = await searchParams
  if (view) {
    redirect(queueRouteForMode(parseQueueNavMode(view)))
  }
  redirect("/assistant-queue/live-desk")
}
