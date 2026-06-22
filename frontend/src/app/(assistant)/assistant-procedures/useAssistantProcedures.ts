"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { ProcedureConsent, ProcedureOrder, ProcedureRequirement, ProcedureStats, ProcedureFilter } from "./assistantProcedures.types"
import type { ProcedureConsentSavePayload } from "./ProcedureConsentDialog"
import {
  fetchAssistantProcedureOrders,
  fetchAssistantProcedureStats,
} from "./assistantProcedures.api"

/* ---------- API helpers ---------- */

async function toggleRequirement(payload: {
  orderId: string
  requirementId: string
  isDone: boolean
}) {
  await apiClient.patch(
    `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}`,
    { isDone: payload.isDone },
  )
}

async function uploadRequirementAttachment(payload: {
  orderId: string
  requirementId: string
  file: File
}) {
  const form = new FormData()
  form.append("file", payload.file)
  await apiClient.post(
    `/assistant/procedures/${payload.orderId}/requirements/${payload.requirementId}/attachment`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  )
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

async function saveProcedureConsent(payload: {
  orderId: string
  consent: ProcedureConsent
  file: File
}) {
  const form = new FormData()
  form.append("file", payload.file)
  form.append("consent", JSON.stringify(payload.consent))
  await apiClient.post(`/assistant/procedures/${payload.orderId}/consent`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
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
    queryFn: fetchAssistantProcedureOrders,
    staleTime: 30 * 1000,
  })

  const statsQuery = useQuery<ProcedureStats, Error>({
    queryKey: statsKey,
    queryFn: fetchAssistantProcedureStats,
    staleTime: 30 * 1000,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ordersKey }),
      queryClient.invalidateQueries({ queryKey: statsKey }),
      queryClient.invalidateQueries({ queryKey: ["assistant-procedures-schedule"] }),
      queryClient.invalidateQueries({ queryKey: ["assistant-procedures-history"] }),
    ])
  }

  const patchLocalOrders = (updater: (orders: ProcedureOrder[]) => ProcedureOrder[]) => {
    queryClient.setQueryData<ProcedureOrder[]>(ordersKey, (prev) =>
      prev ? updater(prev) : prev,
    )
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
    onSettled: invalidateAll,
  })

  const uploadMutation = useMutation({
    mutationFn: uploadRequirementAttachment,
    onSettled: invalidateAll,
  })

  const addMutation = useMutation({
    mutationFn: addRequirement,
    onSettled: invalidateAll,
  })

  const editMutation = useMutation({
    mutationFn: editRequirement,
    onSettled: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRequirement,
    onSettled: invalidateAll,
  })

  const notifyMutation = useMutation({
    mutationFn: notifyPatient,
  })

  const consentMutation = useMutation({
    mutationFn: saveProcedureConsent,
    onSettled: invalidateAll,
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
    onSaveConsent: async (orderId: string, payload: ProcedureConsentSavePayload) => {
      await consentMutation.mutateAsync({
        orderId,
        consent: payload.consent,
        file: payload.file,
      })
    },
    isNotifying: notifyMutation.isPending,
    isSavingConsent: consentMutation.isPending,
    isTogglingRequirement: toggleMutation.isPending,
    isUploadingAttachment: uploadMutation.isPending,
    isLoading: ordersQuery.isLoading || statsQuery.isLoading,
    isError: ordersQuery.isError || statsQuery.isError,
  }
}
