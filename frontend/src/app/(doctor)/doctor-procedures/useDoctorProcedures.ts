"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { fetchDoctorProcedureOrders } from "@/app/(assistant)/assistant-procedures/assistantProcedures.api"
import type {
  ProcedureFilter,
  ProcedureOrder,
  ProcedureStats,
} from "@/app/(assistant)/assistant-procedures/assistantProcedures.types"
import { getProcedureReadiness } from "./doctorProcedures.shared"

export type DoctorProcedureStats = ProcedureStats & {
  urgentCount: number
  pendingClearance: number
}

function computeDoctorStats(orders: ProcedureOrder[]): DoctorProcedureStats {
  const urgentCount = orders.filter(
    (o) => o.priority === "urgent" || o.priority === "emergency",
  ).length
  const pendingClearance = orders.filter((o) => {
    if (o.status === "completed") return false
    const { pct } = getProcedureReadiness(o)
    return o.status === "pending" || pct < 100
  }).length

  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) => o.status === "in-progress").length,
    completed: orders.filter((o) => o.status === "completed").length,
    urgentCount,
    pendingClearance,
  }
}

export function useDoctorProcedures() {
  const [filter, setFilter] = useState<ProcedureFilter>("all")
  const [searchTerm, setSearchTerm] = useState("")

  const query = useQuery({
    queryKey: ["doctor-procedures"],
    queryFn: fetchDoctorProcedureOrders,
    staleTime: 2 * 60 * 1000,
  })

  const stats = useMemo(
    () => computeDoctorStats(query.data ?? []),
    [query.data],
  )

  const filteredOrders = useMemo(() => {
    let list = query.data ?? []
    const q = searchTerm.trim().toLowerCase()

    if (filter !== "all") {
      list = list.filter((o) => o.status === filter)
    }

    if (q) {
      list = list.filter(
        (o) =>
          o.patientName.toLowerCase().includes(q) ||
          o.procedureName.toLowerCase().includes(q) ||
          o.patientId.toLowerCase().includes(q),
      )
    }

    return list
  }, [query.data, filter, searchTerm])

  const allOrders = query.data ?? []

  const pendingReviewOrders = useMemo(
    () =>
      allOrders.filter((o) => {
        if (o.status === "completed") return false
        const { pct } = getProcedureReadiness(o)
        return o.status === "pending" || o.status === "in-progress" || pct < 100
      }),
    [allOrders],
  )

  const completedOrders = useMemo(
    () => allOrders.filter((o) => o.status === "completed"),
    [allOrders],
  )

  const scheduledOrders = useMemo(
    () => allOrders.filter((o) => Boolean(o.scheduledAt)),
    [allOrders],
  )

  return {
    orders: filteredOrders,
    allOrders,
    pendingReviewOrders,
    completedOrders,
    scheduledOrders,
    stats,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    isLoading: query.isLoading,
    getOrderById: (id: string) => allOrders.find((o) => o.id === id) ?? null,
  }
}
