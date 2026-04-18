"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { QueuePatient, QueueStats, QueueFilter, QueueStatus } from "./assistantQueue.types"

/* ---------- API helpers ---------- */

async function fetchQueueEntries(filter?: QueueFilter): Promise<QueuePatient[]> {
  const params = filter ? { params: { filter } } : undefined
  const { data } = await apiClient.get<QueuePatient[]>("/assistant/patient-queue", params)
  return data
}

async function fetchStats(): Promise<QueueStats> {
  const { data } = await apiClient.get<QueueStats>("/assistant/patient-queue/stats")
  return data
}

async function updateQueueStatus(payload: { queueId: string; status: QueueStatus }) {
  const { data } = await apiClient.patch(
    `/assistant/patient-queue/${payload.queueId}/status`,
    { status: payload.status },
  )
  return data
}

/* ---------- Query keys ---------- */

const queueKey = (filter?: QueueFilter) => ["assistant-patient-queue", filter ?? "all"]
const statsKey = ["assistant-patient-queue-stats"]

/* ---------- Hook ---------- */

export function useAssistantQueue() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<QueueFilter>("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const queueQuery = useQuery<QueuePatient[], Error>({
    queryKey: queueKey(filter),
    queryFn: () => fetchQueueEntries(filter),
    staleTime: 30 * 1000,
  })

  const statsQuery = useQuery<QueueStats, Error>({
    queryKey: statsKey,
    queryFn: fetchStats,
    staleTime: 30 * 1000,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["assistant-patient-queue"] }),
      queryClient.invalidateQueries({ queryKey: statsKey }),
    ])
  }

  const statusMutation = useMutation({
    mutationFn: updateQueueStatus,
    onSuccess: invalidateAll,
  })

  const patients = queueQuery.data ?? []
  const stats = statsQuery.data ?? {
    totalToday: 0,
    scheduled: 0,
    arrived: 0,
    inWaiting: 0,
    inConsultation: 0,
    completed: 0,
    noShow: 0,
    avgWaitMin: 0,
  }

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients
    const q = searchTerm.toLowerCase()
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.assignedDoctor.toLowerCase().includes(q) ||
        p.condition.toLowerCase().includes(q),
    )
  }, [patients, searchTerm])

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

  const tabCounts = useMemo(() => ({
    active: stats.scheduled + stats.arrived + stats.inWaiting + stats.inConsultation,
    scheduled: stats.scheduled,
    completed: stats.completed,
    "no-show": stats.noShow,
  }), [stats])

  const markArrived = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "arrived" })
  }

  const moveToWaiting = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "waiting" })
  }

  const markNoShow = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "no-show" })
  }

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
    isLoading: queueQuery.isLoading || statsQuery.isLoading,
    isError: queueQuery.isError || statsQuery.isError,
    isUpdating: statusMutation.isPending,
  }
}
