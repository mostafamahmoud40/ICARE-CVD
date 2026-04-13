"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { mockAssistantAppointments } from "./assistantAppointments.mock"
import type { AssistantAppointment, AssistantAppointmentStatus } from "./assistantAppointments.types"

type AppointmentsQueryData = AssistantAppointment[]

const queryKey = ["assistant-appointments"]

export function useAssistantAppointments() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AssistantAppointmentStatus | "all">("all")

  const query = useQuery<AppointmentsQueryData, Error>({
    queryKey,
    queryFn: async () => mockAssistantAppointments,
    staleTime: 5 * 60 * 1000,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { appointmentId: string; status: AssistantAppointmentStatus }) =>
      payload,
    onSuccess: ({ appointmentId, status }) => {
      queryClient.setQueryData<AppointmentsQueryData>(queryKey, (current = []) =>
        current.map((item) => (item.id === appointmentId ? { ...item, status } : item)),
      )
    },
  })

  const appointments = query.data ?? []

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        appointment.patientName.toLowerCase().includes(normalizedSearch) ||
        appointment.doctorName.toLowerCase().includes(normalizedSearch) ||
        appointment.id.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [appointments, searchTerm, statusFilter])

  const counts = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        acc.total += 1
        acc[appointment.status] += 1
        return acc
      },
      { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    )
  }, [appointments])

  return {
    appointments: filteredAppointments,
    totalAppointments: counts.total,
    counts,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
  }
}
