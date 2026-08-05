"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BRIEFING_PREP_CHANGED,
  getBriefingPrepStatus,
  setBriefingPrepStatus,
  type BriefingPrepStatus,
} from "./briefingStorage"
import { BRIEFING_PREP_STEPS } from "./usePatientBriefing"

const PREP_STEP_MS = 500
const PREP_FINISH_MS = 350

export function startBriefingPreparation(queueEntryId: string) {
  const current = getBriefingPrepStatus(queueEntryId)
  if (current === "ready" || current === "preparing") return

  setBriefingPrepStatus(queueEntryId, "preparing")

  const totalMs = BRIEFING_PREP_STEPS.length * PREP_STEP_MS + PREP_FINISH_MS
  window.setTimeout(() => {
    setBriefingPrepStatus(queueEntryId, "ready")
  }, totalMs)
}

export function useBriefingPreparation(queueEntryId: string, enabled = true) {
  const [status, setStatus] = useState<BriefingPrepStatus>("idle")
  const [prepStep, setPrepStep] = useState(0)

  const sync = useCallback(() => {
    setStatus(getBriefingPrepStatus(queueEntryId))
  }, [queueEntryId])

  useEffect(() => {
    if (!enabled) return
    sync()

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ queueEntryId?: string }>).detail
      if (detail?.queueEntryId && detail.queueEntryId !== queueEntryId) return
      sync()
    }

    window.addEventListener(BRIEFING_PREP_CHANGED, onChange)
    return () => window.removeEventListener(BRIEFING_PREP_CHANGED, onChange)
  }, [enabled, queueEntryId, sync])

  useEffect(() => {
    if (!enabled) return
    if (status !== "preparing") {
      if (status === "ready") setPrepStep(BRIEFING_PREP_STEPS.length)
      return
    }

    setPrepStep(0)
    const timers = BRIEFING_PREP_STEPS.map((_, index) =>
      window.setTimeout(() => setPrepStep(index + 1), (index + 1) * PREP_STEP_MS),
    )

    return () => timers.forEach(clearTimeout)
  }, [enabled, status, queueEntryId])

  useEffect(() => {
    if (!enabled) return
    if (status === "idle") {
      startBriefingPreparation(queueEntryId)
    }
  }, [enabled, status, queueEntryId])

  return {
    status,
    prepStep: Math.min(prepStep, BRIEFING_PREP_STEPS.length - 1),
    isReady: status === "ready",
    isPreparing: status === "preparing",
  }
}
