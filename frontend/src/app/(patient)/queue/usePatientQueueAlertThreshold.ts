"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "icare-cvd-patient-queue-alert-ahead-threshold"

export const PATIENT_QUEUE_ALERT_AHEAD_MIN = 1
export const PATIENT_QUEUE_ALERT_AHEAD_MAX = 5
export const PATIENT_QUEUE_ALERT_AHEAD_DEFAULT = 2

function clampAhead(n: number): number {
  return Math.min(PATIENT_QUEUE_ALERT_AHEAD_MAX, Math.max(PATIENT_QUEUE_ALERT_AHEAD_MIN, Math.round(n)))
}

export function usePatientQueueAlertThreshold() {
  const [aheadThreshold, setAheadThresholdState] = useState(PATIENT_QUEUE_ALERT_AHEAD_DEFAULT)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return
      const n = Number.parseInt(raw, 10)
      if (!Number.isNaN(n)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate-safe read from localStorage after mount
        setAheadThresholdState(clampAhead(n))
      }
    } catch {
      // ignore
    }
  }, [])

  const setAheadThreshold = (n: number) => {
    const v = clampAhead(n)
    setAheadThresholdState(v)
    try {
      localStorage.setItem(STORAGE_KEY, String(v))
    } catch {
      // ignore
    }
  }

  return { aheadThreshold, setAheadThreshold }
}
