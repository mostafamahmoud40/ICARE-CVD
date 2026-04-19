"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

const STORAGE_PATIENT = "icare-consultation-patient-sidebar-w"
const STORAGE_AI = "icare-consultation-ai-panel-w"

function readStoredWidth(key: string, fallback: number, min: number, max: number): number {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n)) return fallback
    return Math.min(max, Math.max(min, n))
  } catch {
    return fallback
  }
}

export function useConsultationPanelWidths() {
  const [patientSidebarWidth, setPatientSidebarWidth] = useState(280)
  const [aiPanelWidth, setAiPanelWidth] = useState(300)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPatientSidebarWidth(readStoredWidth(STORAGE_PATIENT, 280, 200, 480))
    setAiPanelWidth(readStoredWidth(STORAGE_AI, 300, 220, 520))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_PATIENT, String(patientSidebarWidth))
    } catch {
      /* ignore */
    }
  }, [hydrated, patientSidebarWidth])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_AI, String(aiPanelWidth))
    } catch {
      /* ignore */
    }
  }, [hydrated, aiPanelWidth])

  const dragRef = useRef<"patient" | "ai" | null>(null)
  const startXRef = useRef(0)
  const startPatientWRef = useRef(0)
  const startAiWRef = useRef(0)

  const PATIENT_MIN = 200
  const PATIENT_MAX = 480
  const AI_MIN = 220
  const AI_MAX = 520

  const onPatientResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragRef.current = "patient"
      startXRef.current = e.clientX
      startPatientWRef.current = patientSidebarWidth
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [patientSidebarWidth],
  )

  const onAiResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      dragRef.current = "ai"
      startXRef.current = e.clientX
      startAiWRef.current = aiPanelWidth
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [aiPanelWidth],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const mode = dragRef.current
      if (!mode) return
      const dx = e.clientX - startXRef.current
      if (mode === "patient") {
        const next = Math.min(PATIENT_MAX, Math.max(PATIENT_MIN, startPatientWRef.current + dx))
        setPatientSidebarWidth(next)
      } else {
        const next = Math.min(AI_MAX, Math.max(AI_MIN, startAiWRef.current - dx))
        setAiPanelWidth(next)
      }
    }
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [])

  const nudgePatient = useCallback((delta: number) => {
    setPatientSidebarWidth((w) => Math.min(PATIENT_MAX, Math.max(PATIENT_MIN, w + delta)))
  }, [])

  const nudgeAi = useCallback((delta: number) => {
    setAiPanelWidth((w) => Math.min(AI_MAX, Math.max(AI_MIN, w + delta)))
  }, [])

  return {
    patientSidebarWidth,
    aiPanelWidth,
    onPatientResizePointerDown,
    onAiResizePointerDown,
    nudgePatient,
    nudgeAi,
  }
}
