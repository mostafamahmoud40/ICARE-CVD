"use client"

import { useMemo, useState } from "react"
import { mockQueuePatients, mockQueueStats } from "./assistantQueue.mock"
import type { QueuePatient, QueueStats, QueueFilter, QueueStatus } from "./assistantQueue.types"

export function useAssistantQueue() {
  const [patients, setPatients] = useState<QueuePatient[]>(mockQueuePatients)
  const [filter, setFilter] = useState<QueueFilter>("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const stats: QueueStats = useMemo(() => {
    return {
      totalToday: patients.length,
      scheduled: patients.filter((p) => p.status === "scheduled").length,
      arrived: patients.filter((p) => p.status === "arrived").length,
      inWaiting: patients.filter((p) => p.status === "waiting").length,
      inConsultation: patients.filter((p) => p.status === "in-consultation").length,
      completed: patients.filter((p) => p.status === "completed").length,
      noShow: patients.filter((p) => p.status === "no-show" || p.status === "cancelled").length,
      avgWaitMin: mockQueueStats.avgWaitMin,
    }
  }, [patients])

  const inClinicPatients = useMemo(
    () =>
      [...patients]
        .filter((p) => ["arrived", "waiting"].includes(p.status))
        .sort((a, b) => {
          if (a.priority === "emergency" && b.priority !== "emergency") return -1
          if (a.priority !== "emergency" && b.priority === "emergency") return 1
          if (a.priority === "urgent" && b.priority === "normal") return -1
          if (a.priority === "normal" && b.priority === "urgent") return 1
          return 0
        }),
    [patients],
  )

  const selectedPatient = useMemo(
    () => patients.find((p) => p.queueEntryId === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  )

  const filteredPatients = useMemo(() => {
    const sorted = [...patients].sort((a, b) => {
      if (a.status === "in-consultation" && b.status !== "in-consultation") return -1
      if (a.status !== "in-consultation" && b.status === "in-consultation") return 1
      if (a.status === "waiting" && b.status !== "waiting") return -1
      if (a.status !== "waiting" && b.status === "waiting") return 1
      if (a.status === "arrived" && b.status !== "arrived") return -1
      if (a.status !== "arrived" && b.status === "arrived") return 1
      if (a.priority === "emergency" && b.priority !== "emergency") return -1
      if (a.priority !== "emergency" && b.priority === "emergency") return 1
      if (a.priority === "urgent" && b.priority === "normal") return -1
      if (a.priority === "normal" && b.priority === "urgent") return 1
      return 0
    })

    const byFilter =
      filter === "active"
        ? sorted.filter((p) => ["scheduled", "arrived", "waiting", "in-consultation"].includes(p.status))
        : filter === "scheduled"
          ? sorted.filter((p) => p.status === "scheduled")
          : filter === "completed"
            ? sorted.filter((p) => p.status === "completed")
            : sorted.filter((p) => p.status === "no-show" || p.status === "cancelled")

    if (!searchTerm.trim()) return byFilter
    const q = searchTerm.toLowerCase()
    return byFilter.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.assignedDoctor.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q),
    )
  }, [patients, filter, searchTerm])

  const now = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })

  const markArrived = (queueEntryId: string) => {
    const time = now()
    setPatients((prev) =>
      prev.map((p) =>
        p.queueEntryId === queueEntryId
          ? { ...p, status: "arrived" as const, arrivedAt: time }
          : p,
      ),
    )
  }

  const moveToWaiting = (queueEntryId: string) => {
    const time = now()
    setPatients((prev) =>
      prev.map((p) =>
        p.queueEntryId === queueEntryId
          ? { ...p, status: "waiting" as const, waitingSince: time }
          : p,
      ),
    )
  }

  const markNoShow = (queueEntryId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.queueEntryId === queueEntryId
          ? { ...p, status: "no-show" as const }
          : p,
      ),
    )
  }

  const tabCounts = useMemo(() => ({
    active: patients.filter((p) => ["scheduled", "arrived", "waiting", "in-consultation"].includes(p.status)).length,
    scheduled: patients.filter((p) => p.status === "scheduled").length,
    completed: patients.filter((p) => p.status === "completed").length,
    "no-show": patients.filter((p) => p.status === "no-show" || p.status === "cancelled").length,
  }), [patients])

  return {
    patients: filteredPatients,
    allPatients: patients,
    stats,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    tabCounts,
    markArrived,
    moveToWaiting,
    markNoShow,
    selectedPatient,
    selectPatient: setSelectedPatientId,
    clearSelection: () => setSelectedPatientId(null),
    inClinicPatients,
  }
}
