"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  DoctorAppointment,
  AppointmentStatus,
  AppointmentStats,
} from "./doctorAppointments.types"

async function fetchStats(): Promise<AppointmentStats> {
  const { data } = await apiClient.get<AppointmentStats>("/doctor/appointments/stats")
  return data
}

async function fetchAppointments(): Promise<DoctorAppointment[]> {
  const { data } = await apiClient.get<DoctorAppointment[]>("/doctor/appointments")
  return data
}

async function updateAppointmentStatus({
  appointmentId,
  status,
  notes,
}: {
  appointmentId: string
  status: AppointmentStatus
  notes?: string
}) {
  const { data } = await apiClient.patch(`/doctor/appointments/${appointmentId}`, {
    status,
    notes,
  })
  return data
}

async function updateAppointmentNotes({
  appointmentId,
  notes,
}: {
  appointmentId: string
  notes: string
}) {
  const { data } = await apiClient.patch(`/doctor/appointments/${appointmentId}`, { notes })
  return data
}

export type DoctorAvailableSlot = {
  value: string
  label: string
}

async function fetchAvailableSlots(date: string, excludeAppointmentId?: string) {
  const { data } = await apiClient.get<{ date: string; slots: DoctorAvailableSlot[] }>(
    "/doctor/appointments/available-slots",
    { params: { date, excludeAppointmentId } },
  )
  return data.slots
}

async function rescheduleAppointment({
  appointmentId,
  scheduledAt,
}: {
  appointmentId: string
  scheduledAt: string
}) {
  const { data } = await apiClient.patch(`/doctor/appointments/${appointmentId}`, {
    scheduledAt,
  })
  return data
}

export function useDoctorAvailableSlots(
  date: string,
  options?: { enabled?: boolean; excludeAppointmentId?: string },
) {
  const enabled = options?.enabled ?? true
  return useQuery<DoctorAvailableSlot[], Error>({
    queryKey: ["doctor-appointments-available-slots", date, options?.excludeAppointmentId],
    queryFn: () => fetchAvailableSlots(date, options?.excludeAppointmentId),
    enabled: enabled && Boolean(date),
    staleTime: 15 * 1000,
  })
}

export function useDoctorAppointments() {
  const queryClient = useQueryClient()

  const statsQuery = useQuery<AppointmentStats, Error>({
    queryKey: ["doctor-appointments-stats"],
    queryFn: fetchStats,
    staleTime: 60 * 1000,
  })

  const appointmentsQuery = useQuery<DoctorAppointment[], Error>({
    queryKey: ["doctor-appointments"],
    queryFn: fetchAppointments,
    staleTime: 60 * 1000,
  })

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }),
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-stats"] }),
    ])
  }

  const statusMutation = useMutation({
    mutationFn: updateAppointmentStatus,
    onSuccess: invalidateAll,
  })

  const notesMutation = useMutation({
    mutationFn: updateAppointmentNotes,
    onSuccess: invalidateAll,
  })

  const rescheduleMutation = useMutation({
    mutationFn: rescheduleAppointment,
    onSuccess: invalidateAll,
  })

  return {
    stats: statsQuery.data ?? { today: 0, upcoming: 0, completed: 0, cancelled: 0 },
    appointments: appointmentsQuery.data ?? [],
    isLoading: appointmentsQuery.isLoading || statsQuery.isLoading,
    isError: appointmentsQuery.isError || statsQuery.isError,
    updateStatus: statusMutation.mutateAsync,
    updateNotes: notesMutation.mutateAsync,
    reschedule: rescheduleMutation.mutateAsync,
    fetchAvailableSlots,
    isUpdating: statusMutation.isPending || notesMutation.isPending || rescheduleMutation.isPending,
  }
}
