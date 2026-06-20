"use client"

import { useParams } from "next/navigation"

export function useQueueEntryId(): string {
  const params = useParams<{ queueEntryId: string }>()
  const queueEntryId = params.queueEntryId

  if (typeof queueEntryId !== "string" || !queueEntryId) {
    throw new Error("Missing queue entry id in route")
  }

  return queueEntryId
}
