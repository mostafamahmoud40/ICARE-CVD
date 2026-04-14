"use client"

import { useState, useMemo, useCallback } from "react"
import type {
  DoctorAppointment,
  AppointmentStatus,
  DoctorAppointmentsPageData,
} from "./doctorAppointments.types"
import { MOCK_DOCTOR_APPOINTMENTS } from "./doctorAppointments.mock"

function computeStats(appointments: DoctorAppointment[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  return {
    todayCount: appointments.filter(
      (a) =>
        new Date(a.scheduledAt) >= todayStart &&
        new Date(a.scheduledAt) < todayEnd &&
        a.status !== "cancelled",
    ).length,
    upcomingCount: appointments.filter(
      (a) => new Date(a.scheduledAt) > now && a.status !== "cancelled" && a.status !== "completed",
    ).length,
    completedTodayCount: appointments.filter(
      (a) =>
        new Date(a.scheduledAt) >= todayStart &&
        new Date(a.scheduledAt) < todayEnd &&
        a.status === "completed",
    ).length,
    cancelledCount: appointments.filter((a) => a.status === "cancelled").length,
  }
}

export function useDoctorAppointments() {
  // Using mock data until backend doctor appointment endpoints are ready
  const [appointments, setAppointments] = useState<DoctorAppointment[]>(
    MOCK_DOCTOR_APPOINTMENTS.appointments,
  )

  const stats = useMemo(() => computeStats(appointments), [appointments])

  const data: DoctorAppointmentsPageData = useMemo(
    () => ({ appointments, stats }),
    [appointments, stats],
  )

  const updateStatus = useCallback(
    (appointmentId: string, status: AppointmentStatus, notes?: string) => {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId
            ? {
                ...a,
                status,
                notes: notes ?? a.notes,
                ...(status === "cancelled" ? { cancelledAt: new Date().toISOString() } : {}),
              }
            : a,
        ),
      )
    },
    [],
  )

  const updateNotes = useCallback((appointmentId: string, notes: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, notes } : a)),
    )
  }, [])

  return {
    data,
    updateStatus,
    updateNotes,
  }
}
