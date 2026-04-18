"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  AssistantAppointment,
  AssistantAppointmentStatus,
  AvailableSlotOption,
  AppointmentStats,
  DoctorOption,
  PatientOption,
  CreateAppointmentPayload,
} from "./assistantAppointments.types"

async function fetchAppointments(): Promise<AssistantAppointment[]> {
  const { data } = await apiClient.get<AssistantAppointment[]>("/assistant/appointments")
  return data
}

async function fetchStats(): Promise<AppointmentStats> {
  const { data } = await apiClient.get<AppointmentStats>("/assistant/appointments/stats")
  return data
}

async function fetchDoctors(): Promise<DoctorOption[]> {
  const { data } = await apiClient.get<DoctorOption[]>("/assistant/appointments/doctors")
  return data
}

async function fetchPatients(): Promise<PatientOption[]> {
  const { data } = await apiClient.get<PatientOption[]>("/assistant/appointments/patients")
  return data
}

async function updateAppointmentStatus(payload: {
  appointmentId: string
  status: AssistantAppointmentStatus
}) {
  const { data } = await apiClient.patch(
    `/assistant/appointments/${payload.appointmentId}/status`,
    { status: payload.status },
  )
  return data
}

async function createAppointment(payload: CreateAppointmentPayload) {
  const { data } = await apiClient.post("/assistant/appointments", payload)
  return data
}

async function fetchAvailableSlots(doctorId: string, date: string): Promise<AvailableSlotOption[]> {
  const { data } = await apiClient.get<{ date: string; slots: AvailableSlotOption[] }>(
    "/assistant/appointments/available-slots",
    { params: { doctorId, date } },
  )
  return data.slots ?? []
}

const appointmentsKey = ["assistant-appointments"]
const statsKey = ["assistant-appointments-stats"]
const doctorsKey = ["assistant-doctors"]
const patientsKey = ["assistant-patients"]

export function useAssistantAppointments() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<AssistantAppointmentStatus | "all">("all")

  const appointmentsQuery = useQuery<AssistantAppointment[], Error>({
    queryKey: appointmentsKey,
    queryFn: fetchAppointments,
    staleTime: 60 * 1000,
  })

  const statsQuery = useQuery<AppointmentStats, Error>({
    queryKey: statsKey,
    queryFn: fetchStats,
    staleTime: 60 * 1000,
  })

  const doctorsQuery = useQuery<DoctorOption[], Error>({
    queryKey: doctorsKey,
    queryFn: fetchDoctors,
    staleTime: 5 * 60 * 1000,
  })

  const patientsQuery = useQuery<PatientOption[], Error>({
    queryKey: patientsKey,
    queryFn: fetchPatients,
    staleTime: 5 * 60 * 1000,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: appointmentsKey }),
      queryClient.invalidateQueries({ queryKey: statsKey }),
    ])
  }

  const statusMutation = useMutation({
    mutationFn: updateAppointmentStatus,
    onSuccess: invalidateAll,
  })

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: async () => {
      await invalidateAll()
      await queryClient.invalidateQueries({ queryKey: ["assistant-appointments-available-slots"] })
    },
  })

  const appointments = appointmentsQuery.data ?? []
  const stats = statsQuery.data ?? { total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 }

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

  return {
    appointments: filteredAppointments,
    totalAppointments: stats.total,
    counts: stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isLoading: appointmentsQuery.isLoading || statsQuery.isLoading,
    isError: appointmentsQuery.isError || statsQuery.isError,
    error: appointmentsQuery.error ?? statsQuery.error ?? null,
    updateStatus: statusMutation.mutateAsync,
    isUpdatingStatus: statusMutation.isPending,
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    doctors: doctorsQuery.data ?? [],
    patients: patientsQuery.data ?? [],
  }
}

export function useAssistantAppointmentAvailableSlots(doctorId: string, date: string) {
  return useQuery<AvailableSlotOption[], Error>({
    queryKey: ["assistant-appointments-available-slots", doctorId, date],
    queryFn: () => fetchAvailableSlots(doctorId, date),
    enabled: Boolean(doctorId && date),
    staleTime: 15 * 1000,
  })
}
