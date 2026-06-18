"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { QueuePatient, QueueStats, QueueStatus } from "./doctorQueue.types"

/* ---------- API helpers ---------- */

async function fetchQueueEntries(filter?: string): Promise<QueuePatient[]> {
  const params = filter ? { params: { filter } } : undefined
  const { data } = await apiClient.get<QueuePatient[]>("/doctor/queue", params)
  return data
}

async function fetchStats(): Promise<QueueStats> {
  const { data } = await apiClient.get<QueueStats>("/doctor/queue/stats")
  return data
}

async function updateQueueStatus(payload: { queueId: string; status: QueueStatus }) {
  const { data } = await apiClient.patch(
    `/doctor/queue/${payload.queueId}/status`,
    { status: payload.status },
  )
  return data
}

/* ---------- Query keys ---------- */

const queueKey = (filter?: string) => ["doctor-queue", filter ?? "all"]
const statsKey = ["doctor-queue-stats"]

/* ---------- Hook ---------- */

export function useDoctorQueue() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string>("active")

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
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] }),
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
    reportPending: 0,
    completed: 0,
    noShow: 0,
    avgWaitMin: 0,
    currentWaitMin: 0,
  }

  const tabCounts = useMemo(() => ({
    active:
      stats.scheduled +
      stats.arrived +
      stats.inWaiting +
      stats.inConsultation +
      (stats.reportPending ?? 0),
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

  const startConsultation = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "in-consultation" })
  }

  const complete = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "completed" })
  }

  const markNoShow = (queueEntryId: string) => {
    statusMutation.mutate({ queueId: queueEntryId, status: "no-show" })
  }

  return {
    patients,
    stats,
    filter,
    setFilter,
    tabCounts,
    markArrived,
    moveToWaiting,
    startConsultation,
    complete,
    markNoShow,
    isLoading: queueQuery.isLoading || statsQuery.isLoading,
    isError: queueQuery.isError || statsQuery.isError,
    isUpdating: statusMutation.isPending,
  }
}
