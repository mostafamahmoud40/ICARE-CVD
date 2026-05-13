"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ProcedureOrder, ProcedureRequirement, ProcedureStats, ProcedureFilter } from "./assistantProcedures.types"
import { mockProcedureOrders, mockProcedureStats } from "./assistantProcedures.mock"

/* ---------- API helpers ---------- */

async function fetchProcedureOrders(): Promise<ProcedureOrder[]> {
  return mockProcedureOrders
}

async function fetchProcedureStats(): Promise<ProcedureStats> {
  return mockProcedureStats
}

async function toggleRequirement(payload: {
  orderId: string
  requirementId: string
  isDone: boolean
}) {
  try {
    await apiClient.patch(
      `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}`,
      { isDone: payload.isDone },
    )
  } catch {
    /* Local-first until assistant procedures API exists */
  }
}

async function uploadRequirementAttachment(payload: {
  orderId: string
  requirementId: string
  file: File
}) {
  const form = new FormData()
  form.append("file", payload.file)
  try {
    await apiClient.post(
      `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}/attachment`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    )
  } catch {
    /* Backend optional — optimistic attachment stays in React Query cache */
  }
}

async function addRequirement(payload: {
  orderId: string
  title: string
  description: string | null
  allowsAttachment: boolean
  dueAt: string | null
}) {
  const { data } = await apiClient.post<ProcedureRequirement>(
    `/assistant/procedures/${payload.orderId}/requirements`,
    {
      title: payload.title,
      description: payload.description,
      allowsAttachment: payload.allowsAttachment,
      dueAt: payload.dueAt,
    },
  )
  return data
}

async function editRequirement(payload: {
  orderId: string
  requirementId: string
  title: string
  description: string | null
  allowsAttachment: boolean
  dueAt: string | null
}) {
  await apiClient.patch(
    `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}`,
    {
      title: payload.title,
      description: payload.description,
      allowsAttachment: payload.allowsAttachment,
      dueAt: payload.dueAt,
    },
  )
}

async function deleteRequirement(payload: { orderId: string; requirementId: string }) {
  await apiClient.delete(
    `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}`,
  )
}

async function notifyPatient(payload: { orderId: string }) {
  await apiClient.post(`/assistant/procedures/${payload.orderId}/notify-patient`)
}

/* ---------- Query keys ---------- */

const ordersKey = ["assistant-procedures"]
const statsKey = ["assistant-procedures-stats"]

/* ---------- Hook ---------- */

export function useAssistantProcedures() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ProcedureFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const ordersQuery = useQuery<ProcedureOrder[], Error>({
    queryKey: ordersKey,
    queryFn: fetchProcedureOrders,
    staleTime: 30 * 1000,
    retry: 0,
  })

  const statsQuery = useQuery<ProcedureStats, Error>({
    queryKey: statsKey,
    queryFn: fetchProcedureStats,
    staleTime: 30 * 1000,
    retry: 0,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersKey }),
      queryClient.invalidateQueries({ queryKey: statsKey }),
    ])
  }

  const toggleMutation = useMutation({
    mutationFn: toggleRequirement,
    onMutate: async ({ orderId, requirementId, isDone }) => {
      await queryClient.cancelQueries({ queryKey: ordersKey })
      const completedAt = isDone ? new Date().toISOString() : null
      patchLocalOrders((orders) =>
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                requirements: o.requirements.map((r) =>
                  r.id === requirementId ? { ...r, isDone, completedAt } : r,
                ),
              }
            : o,
        ),
      )
    },
    onError: invalidateAll,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadRequirementAttachment,
    onMutate: async ({ orderId, requirementId, file }) => {
      await queryClient.cancelQueries({ queryKey: ordersKey })
      const blobUrl = URL.createObjectURL(file)
      patchLocalOrders((orders) =>
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                requirements: o.requirements.map((r) =>
                  r.id === requirementId
                    ? {
                        ...r,
                        attachmentUrl: blobUrl,
                        attachmentName: file.name,
                      }
                    : r,
                ),
              }
            : o,
        ),
      )
      return { blobUrl }
    },
    onError: (_err, variables, ctx) => {
      if (ctx?.blobUrl) URL.revokeObjectURL(ctx.blobUrl)
      void invalidateAll()
    },
    /* Do not invalidate on success — mock refetch would drop blob URLs */
  })

  /* Optimistic local helpers (UI-only until backend exists) */
  const patchLocalOrders = (updater: (orders: ProcedureOrder[]) => ProcedureOrder[]) => {
    queryClient.setQueryData<ProcedureOrder[]>(ordersKey, (prev) =>
      prev ? updater(prev) : prev,
    )
  }

  const addMutation = useMutation({
    mutationFn: addRequirement,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ordersKey })
      const optimistic: ProcedureRequirement = {
        id: `local-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        allowsAttachment: payload.allowsAttachment,
        dueAt: payload.dueAt,
        isDone: false,
        completedAt: null,
        attachmentUrl: null,
        attachmentName: null,
      }
      patchLocalOrders((orders) =>
        orders.map((o) =>
          o.id === payload.orderId
            ? { ...o, requirements: [...o.requirements, optimistic] }
            : o,
        ),
      )
    },
    onError: invalidateAll,
    onSuccess: invalidateAll,
  })

  const editMutation = useMutation({
    mutationFn: editRequirement,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ordersKey })
      patchLocalOrders((orders) =>
        orders.map((o) =>
          o.id === payload.orderId
            ? {
                ...o,
                requirements: o.requirements.map((r) =>
                  r.id === payload.requirementId
                    ? {
                        ...r,
                        title: payload.title,
                        description: payload.description,
                        allowsAttachment: payload.allowsAttachment,
                        dueAt: payload.dueAt,
                      }
                    : r,
                ),
              }
            : o,
        ),
      )
    },
    onError: invalidateAll,
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRequirement,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ordersKey })
      patchLocalOrders((orders) =>
        orders.map((o) =>
          o.id === payload.orderId
            ? { ...o, requirements: o.requirements.filter((r) => r.id !== payload.requirementId) }
            : o,
        ),
      )
    },
    onError: invalidateAll,
    onSuccess: invalidateAll,
  })

  const notifyMutation = useMutation({
    mutationFn: notifyPatient,
  })

  const orders = ordersQuery.data ?? []

  const filteredOrders = useMemo(() => {
    let result = orders
    if (filter !== "all") {
      result = result.filter((o) => o.status === filter)
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (o) =>
          o.patientName.toLowerCase().includes(q) ||
          o.doctorName.toLowerCase().includes(q) ||
          o.procedureName.toLowerCase().includes(q),
      )
    }
    return result
  }, [orders, filter, searchTerm])

  const stats = statsQuery.data ?? { total: 0, pending: 0, inProgress: 0, completed: 0 }

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  )

  return {
    orders: filteredOrders,
    stats,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    selectedOrder,
    selectOrder: (id: string) => setSelectedOrderId(id),
    clearSelection: () => setSelectedOrderId(null),
    onToggleRequirement: (orderId: string, requirementId: string, isDone: boolean) =>
      toggleMutation.mutate({ orderId, requirementId, isDone }),
    onUploadAttachment: (orderId: string, requirementId: string, file: File) =>
      uploadMutation.mutateAsync({ orderId, requirementId, file }),
    onAddRequirement: (
      orderId: string,
      title: string,
      description: string | null,
      allowsAttachment: boolean,
      dueAt: string | null,
    ) => addMutation.mutate({ orderId, title, description, allowsAttachment, dueAt }),
    onEditRequirement: (
      orderId: string,
      requirementId: string,
      title: string,
      description: string | null,
      allowsAttachment: boolean,
      dueAt: string | null,
    ) => editMutation.mutate({ orderId, requirementId, title, description, allowsAttachment, dueAt }),
    onDeleteRequirement: (orderId: string, requirementId: string) =>
      deleteMutation.mutate({ orderId, requirementId }),
    onNotifyPatient: (orderId: string) => notifyMutation.mutateAsync({ orderId }),
    isNotifying: notifyMutation.isPending,
    isTogglingRequirement: toggleMutation.isPending,
    isUploadingAttachment: uploadMutation.isPending,
    isLoading: ordersQuery.isLoading || statsQuery.isLoading,
    isError: ordersQuery.isError || statsQuery.isError,
  }
}
