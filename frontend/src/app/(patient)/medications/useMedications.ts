"use client"

import { useState, useMemo, useCallback } from "react"
import type {
  Medication,
  DoseLog,
  MedicationsPageData,
} from "./medications.types"
import { MOCK_MEDICATIONS } from "./medications.mock"

function computeStats(medications: Medication[], doseLog: DoseLog[]) {
  const active = medications.filter((m) => m.status === "active")
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const takenToday = doseLog.filter(
    (l) => !l.skipped && new Date(l.takenAt) >= todayStart,
  ).length

  const totalDosesToday = active.reduce((sum, m) => sum + m.timeOfDay.length, 0)

  const last7Days = doseLog.filter((l) => {
    const d = new Date(l.takenAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })
  const taken7 = last7Days.filter((l) => !l.skipped).length
  const adherencePercent = last7Days.length > 0 ? Math.round((taken7 / last7Days.length) * 100) : 100

  return {
    totalActive: active.length,
    takenToday,
    dueToday: totalDosesToday,
    adherencePercent,
  }
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>(
    MOCK_MEDICATIONS.medications,
  )
  const [doseLog, setDoseLog] = useState<DoseLog[]>(MOCK_MEDICATIONS.doseLog)

  const stats = useMemo(() => computeStats(medications, doseLog), [medications, doseLog])

  const data: MedicationsPageData = useMemo(
    () => ({ medications, doseLog, stats }),
    [medications, doseLog, stats],
  )

  const markAsTaken = useCallback((medicationId: string) => {
    const logEntry: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId,
      takenAt: new Date().toISOString(),
      skipped: false,
    }
    setDoseLog((prev) => [...prev, logEntry])
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medicationId ? { ...m, lastTakenAt: logEntry.takenAt } : m,
      ),
    )
  }, [])

  const markAsSkipped = useCallback((medicationId: string) => {
    const logEntry: DoseLog = {
      id: `log-${Date.now()}`,
      medicationId,
      takenAt: new Date().toISOString(),
      skipped: true,
    }
    setDoseLog((prev) => [...prev, logEntry])
  }, [])

  return {
    data,
    markAsTaken,
    markAsSkipped,
  }
}
