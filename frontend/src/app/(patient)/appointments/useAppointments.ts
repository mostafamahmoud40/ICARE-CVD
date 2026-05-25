"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { AppointmentsPageData } from "./appointments.types"
import {
  normalizeAppointmentBookingStatus,
  partitionAppointmentsByBooking,
} from "./appointments.utils"

type DoctorApiRow = {
  id: string
  name: string
  title: string
  experience: string
  specialties: { icon: string; label: string; color: "primary" | "secondary" }[]
}

type AppointmentApiRow = {
  id: string
  confirmationCode: string
  scheduledAt: string
  department: string
  reason?: string
  clinician: string
  location: string
  locationDetail?: string
  status: string
  rescheduledTo?: string
  cancellationReason?: string
  cancelledBy?: "patient" | "doctor" | "clinic"
  cancelledAt?: string
  notes?: string
  symptoms?: string
  visitType: "clinic" | "virtual"
}

type DoctorAvailabilityApi = {
  monthLabel: string
  days: { day: string; date: number; fullDate: string; disabled?: boolean; label?: string }[]
  timeSlotsByDate: Record<
    string,
    { time: string; available: boolean; recommended?: boolean; label?: string }[]
  >
}

type CreateAppointmentPayload = {
  doctorId: string
  scheduledAt: string
  visitType: "clinic" | "virtual"
  reason: string
}

function mapAppointmentRow(row: AppointmentApiRow): Appointment {
  return {
    ...row,
    status: normalizeAppointmentBookingStatus(row.status, row.scheduledAt),
    rescheduledTo: row.rescheduledTo,
    cancellationReason: row.cancellationReason,
    cancelledBy: row.cancelledBy,
    cancelledAt: row.cancelledAt,
  }
}

async function fetchAppointmentsPage(): Promise<AppointmentsPageData> {
  const [doctorsResult, appointmentsResult] = await Promise.allSettled([
    apiClient.get<DoctorApiRow[]>("/patient/appointments/doctors"),
    apiClient.get<AppointmentApiRow[]>("/patient/appointments"),
  ])

  const doctors = (doctorsResult.status === "fulfilled" ? doctorsResult.value.data : []).map((d) => ({
    ...d,
    rating: 4.8,
  }))
  const appointments = (appointmentsResult.status === "fulfilled" ? appointmentsResult.value.data : []).map(
    mapAppointmentRow,
  )
  const { upcoming, past } = partitionAppointmentsByBooking(appointments)
  const selectedDoctor = doctors[0] ?? null

  const now = new Date()
  let availability: DoctorAvailabilityApi = {
    monthLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    days: [],
    timeSlotsByDate: {},
  }

  if (selectedDoctor) {
    try {
      const { data } = await apiClient.get<DoctorAvailabilityApi>(
        `/patient/appointments/doctors/${selectedDoctor.id}/availability`,
      )
      availability = data
    } catch {
      // Keep booking UI resilient even if availability endpoint fails.
    }
  }

  return {
    doctors,
    selectedDoctor,
    days: availability.days,
    timeSlotsByDate: availability.timeSlotsByDate,
    appointments,
    upcoming,
    past,
    fees: [
      { label: "Consultation Fee", amount: "$150.00" },
      { label: "Platform Fee", amount: "$5.00" },
      { label: "Insurance Cover", amount: "-$130.00", highlight: true, icon: "shield" },
    ],
    monthLabel: availability.monthLabel,
    aiTipTitle: "Why this time slot?",
    aiTipBody:
      "Our system analyzed past visits. The selected recommended slots typically have lower waiting times.",
  }
}

export function useAppointments() {
  const queryClient = useQueryClient()
  const query = useQuery<AppointmentsPageData, Error>({
    queryKey: ["patient-appointments"],
    queryFn: fetchAppointmentsPage,
    staleTime: 5 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: CreateAppointmentPayload) => {
      const { data } = await apiClient.post("/patient/appointments", payload)
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-appointments"] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data } = await apiClient.patch(`/patient/appointments/${appointmentId}/cancel`)
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient-appointments"] })
    },
  })

  return {
    ...query,
    createAppointment: createMutation.mutateAsync,
    isCreatingAppointment: createMutation.isPending,
    cancelAppointment: cancelMutation.mutateAsync,
    isCancellingAppointment: cancelMutation.isPending,
  }
}
