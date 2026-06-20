"use client"

import { useCallback, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { appointmentMatchesAdvancedFilters } from "./appointment-filter-helpers"
import { resolveAppointmentDisplayStatus } from "@/app/(doctor)/doctor-appointments/appointmentDisplayStatus"
import type {
  AssistantAppointment,
  AssistantAppointmentAdvancedFilters,
  AssistantAppointmentStatus,
  AvailableSlotOption,
  AppointmentStats,
  DoctorOption,
  PatientOption,
  CreateAppointmentPayload,
  PatchAssistantAppointmentPayload,
} from "./assistantAppointments.types"
import { defaultAssistantAppointmentAdvancedFilters } from "./assistantAppointments.types"

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
  cancellationReason?: string
}) {
  const body: { status: AssistantAppointmentStatus; cancellationReason?: string } = { status: payload.status }
  if (payload.cancellationReason) {
    body.cancellationReason = payload.cancellationReason
  }
  const { data } = await apiClient.patch(
    `/assistant/appointments/${payload.appointmentId}/status`,
    body,
  )
  return data
}

async function createAppointment(payload: CreateAppointmentPayload) {
  const { data } = await apiClient.post("/assistant/appointments", payload)
  return data
}

async function patchAppointment(
  appointmentId: string,
  payload: PatchAssistantAppointmentPayload,
): Promise<AssistantAppointment> {
  const { data } = await apiClient.patch<AssistantAppointment>(
    `/assistant/appointments/${appointmentId}`,
    payload,
  )
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
  const [advancedFilters, setAdvancedFilters] = useState<AssistantAppointmentAdvancedFilters>(
    () => ({ ...defaultAssistantAppointmentAdvancedFilters }),
  )

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

  const patchMutation = useMutation({
    mutationFn: (args: { appointmentId: string; payload: PatchAssistantAppointmentPayload }) =>
      patchAppointment(args.appointmentId, args.payload),
    onSuccess: async () => {
      await invalidateAll()
      await queryClient.invalidateQueries({ queryKey: ["assistant-appointments-available-slots"] })
    },
  })

  const appointments = useMemo(() => appointmentsQuery.data ?? [], [appointmentsQuery.data])

  const stats = useMemo(() => {
    let total = 0
    let scheduled = 0
    let completed = 0
    let cancelled = 0

    for (const app of appointments) {
      total++
      const display = resolveAppointmentDisplayStatus(app)
      if (display === "completed") {
        completed++
      } else if (display === "cancelled" || display === "no-show") {
        cancelled++
      } else {
        scheduled++
      }
    }

    return { total, scheduled, completed, cancelled, confirmed: 0 }
  }, [appointments])

  const doctorFilterOptions = useMemo(() => {
    const names = new Set<string>()
    for (const a of appointments) {
      const n = a.doctorName?.trim()
      if (n) names.add(n)
    }
    for (const d of doctorsQuery.data ?? []) {
      const n = d.name?.trim()
      if (n) names.add(n)
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [appointments, doctorsQuery.data])

  const departmentOptions = useMemo(() => {
    const set = new Set<string>()
    for (const a of appointments) {
      const d = a.department?.trim()
      if (d) set.add(d)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [appointments])

  const hasActiveAdvancedFilters = useMemo(
    () =>
      advancedFilters.visitType !== "all" ||
      advancedFilters.doctorName.trim() !== "" ||
      advancedFilters.department.trim() !== "" ||
      advancedFilters.dateScope !== "all",
    [advancedFilters],
  )

  const resetAdvancedFilters = useCallback(() => {
    setAdvancedFilters({ ...defaultAssistantAppointmentAdvancedFilters })
  }, [])

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return appointments.filter((appointment) => {
      let matchesStatus = false
      if (statusFilter === "all") {
        matchesStatus = true
      } else {
        const display = resolveAppointmentDisplayStatus(appointment)
        if (statusFilter === "completed") {
          matchesStatus = display === "completed"
        } else if (statusFilter === "cancelled") {
          matchesStatus = display === "cancelled" || display === "no-show"
        } else if (statusFilter === "scheduled") {
          matchesStatus =
            display === "scheduled" ||
            display === "arrived" ||
            display === "waiting" ||
            display === "in-consultation" ||
            display === "report-pending" ||
            display === "overdue"
        }
      }

      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          appointment.patientName,
          appointment.doctorName,
          appointment.id,
          appointment.reason,
          appointment.department,
          appointment.patientEmail,
          appointment.patientPhone ?? "",
        ].some((field) => field.toLowerCase().includes(normalizedSearch))

      const matchesAdv = appointmentMatchesAdvancedFilters(appointment, advancedFilters)

      return matchesStatus && matchesSearch && matchesAdv
    })
  }, [appointments, searchTerm, statusFilter, advancedFilters])

  return {
    appointments: filteredAppointments,
    totalAppointments: stats.total,
    counts: stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    advancedFilters,
    setAdvancedFilters,
    resetAdvancedFilters,
    hasActiveAdvancedFilters,
    doctorFilterOptions,
    departmentOptions,
    isLoading: appointmentsQuery.isLoading || statsQuery.isLoading,
    isError: appointmentsQuery.isError || statsQuery.isError,
    error: appointmentsQuery.error ?? statsQuery.error ?? null,
    updateStatus: statusMutation.mutateAsync,
    isUpdatingStatus: statusMutation.isPending,
    createAppointment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateAppointment: patchMutation.mutateAsync,
    isUpdatingAppointment: patchMutation.isPending,
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
