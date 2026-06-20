"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CONSULTATION_DRAFT_CHANGED,
  hasConsultationDraft,
} from "./[queueEntryId]/consultation/consultationDraftStorage"

export function useHasConsultationDraft(queueEntryId: string): boolean {
  const read = useCallback(() => hasConsultationDraft(queueEntryId), [queueEntryId])
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    setHasDraft(read())

    const refresh = (event?: Event) => {
      const detail = (event as CustomEvent<{ queueEntryId?: string }> | undefined)?.detail
      if (detail?.queueEntryId && detail.queueEntryId !== queueEntryId) return
      setHasDraft(read())
    }

    window.addEventListener(CONSULTATION_DRAFT_CHANGED, refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener(CONSULTATION_DRAFT_CHANGED, refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [queueEntryId, read])

  return hasDraft
}
