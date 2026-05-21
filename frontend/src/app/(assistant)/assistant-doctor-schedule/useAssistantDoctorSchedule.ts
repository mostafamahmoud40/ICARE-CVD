"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { doctorScheduleSchema } from "@/app/(doctor)/doctor-schedule/doctorSchedule.schema"
import type { DoctorSchedulePayload, WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"

import {
  getAssistantDoctorScheduleBundle,
  setAssistantDoctorScheduleBundle,
  type AssistantDoctorScheduleBundle,
} from "./assistantDoctorSchedule.store"
import { computeAvailableSlotsForDay } from "./assistantDoctorSchedule.slots"

export const assistantDoctorScheduleQueryKey = (doctorId: string) =>
  ["assistant-doctor-schedule", doctorId] as const

export function useAssistantDoctorSchedule(doctorId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: assistantDoctorScheduleQueryKey(doctorId),
    queryFn: async (): Promise<AssistantDoctorScheduleBundle> => getAssistantDoctorScheduleBundle(doctorId),
    enabled: doctorId.length > 0,
    staleTime: 30 * 1000,
  })

  const saveScheduleMutation = useMutation({
    mutationFn: async (schedule: DoctorSchedulePayload) => {
      const parsed = doctorScheduleSchema.safeParse(schedule)
      if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "Invalid schedule."
        throw new Error(msg)
      }
      const prev = getAssistantDoctorScheduleBundle(doctorId)
      const next: AssistantDoctorScheduleBundle = {
        ...prev,
        schedule: parsed.data,
      }
      setAssistantDoctorScheduleBundle(doctorId, next)
      return next
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Schedule updated", {
        description: "Changes are saved locally (demo) until the API is connected.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not save", { description: e.message })
    },
  })

  const moveDemoBookingMutation = useMutation({
    mutationFn: async ({
      bookingId,
      startTime,
      endTime,
      schedule,
    }: {
      bookingId: string
      startTime: string
      endTime: string
      schedule: DoctorSchedulePayload
    }) => {
      const bundle = getAssistantDoctorScheduleBundle(doctorId)
      const booking = bundle.demoBookings.find((b) => b.id === bookingId)
      if (!booking) {
        throw new Error("Booking not found.")
      }
      const day = schedule.days.find((d) => d.weekday === booking.weekday)
      if (!day?.enabled) {
        throw new Error("That weekday is closed in the current draft.")
      }

      const available = computeAvailableSlotsForDay({
        day,
        slotDurationMinutes: schedule.slotDurationMinutes,
        bufferBetweenSlotsMinutes: schedule.bufferBetweenSlotsMinutes,
        pausedPeriodIds: bundle.pausedPeriodIds,
        demoBookings: bundle.demoBookings,
        weekday: booking.weekday,
        excludeBookingId: bookingId,
        doctorArrivalTime: bundle.doctorArrivalByWeekday[booking.weekday],
      })
      const ok = available.some((s) => s.startTime === startTime && s.endTime === endTime)
      if (!ok) {
        throw new Error("That time is not available.")
      }

      const nextBookings = bundle.demoBookings.map((b) =>
        b.id === bookingId ? { ...b, startTime, endTime } : b,
      )
      const next: AssistantDoctorScheduleBundle = {
        ...bundle,
        demoBookings: nextBookings,
      }
      setAssistantDoctorScheduleBundle(doctorId, next)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Booking moved", {
        description: "The patient is now on a free slot (demo data in memory).",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not move booking", { description: e.message })
    },
  })

  const cancelDemoBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const bundle = getAssistantDoctorScheduleBundle(doctorId)
      if (!bundle.demoBookings.some((b) => b.id === bookingId)) {
        throw new Error("Booking not found.")
      }
      const nextBookings = bundle.demoBookings.filter((b) => b.id !== bookingId)
      const next: AssistantDoctorScheduleBundle = {
        ...bundle,
        demoBookings: nextBookings,
      }
      setAssistantDoctorScheduleBundle(doctorId, next)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Booking cancelled", {
        description: "The slot is free again in this demo (memory only).",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not cancel booking", { description: e.message })
    },
  })

  const togglePeriodPauseMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const bundle = getAssistantDoctorScheduleBundle(doctorId)
      const set = new Set(bundle.pausedPeriodIds)
      if (set.has(periodId)) set.delete(periodId)
      else set.add(periodId)
      const next: AssistantDoctorScheduleBundle = {
        ...bundle,
        pausedPeriodIds: [...set],
      }
      setAssistantDoctorScheduleBundle(doctorId, next)
      return { periodId, paused: set.has(periodId) }
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success(res.paused ? "Session paused" : "Session resumed", {
        description: res.paused
          ? "Bookings should not use this window until you resume it."
          : "This working window is active again (demo).",
      })
    },
  })

  /**
   * Set (or clear) the doctor's arrival time for a specific weekday.
   * Pass `null` to clear the override (use the period's natural start time).
   */
  const setDoctorArrivalMutation = useMutation({
    mutationFn: async ({ weekday, arrivalTime }: { weekday: WeekdayId; arrivalTime: string | null }) => {
      const bundle = getAssistantDoctorScheduleBundle(doctorId)
      const next: AssistantDoctorScheduleBundle = {
        ...bundle,
        doctorArrivalByWeekday: {
          ...bundle.doctorArrivalByWeekday,
          [weekday]: arrivalTime,
        },
      }
      setAssistantDoctorScheduleBundle(doctorId, next)
      return { weekday, arrivalTime }
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      if (res.arrivalTime) {
        toast.success("Arrival time updated", {
          description: `Free slots for ${res.weekday} now start from ${res.arrivalTime}.`,
        })
      } else {
        toast.success("Arrival time cleared", {
          description: `${res.weekday} slots revert to the scheduled start time.`,
        })
      }
    },
    onError: (e: Error) => {
      toast.error("Could not update arrival", { description: e.message })
    },
  })

  return {
    bundle: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveScheduleAsync: saveScheduleMutation.mutateAsync,
    isSaving: saveScheduleMutation.isPending,
    togglePeriodPause: togglePeriodPauseMutation.mutate,
    isTogglingPause: togglePeriodPauseMutation.isPending,
    moveDemoBookingAsync: moveDemoBookingMutation.mutateAsync,
    isMovingDemoBooking: moveDemoBookingMutation.isPending,
    cancelDemoBooking: cancelDemoBookingMutation.mutate,
    isCancellingDemoBooking: cancelDemoBookingMutation.isPending,
    cancellingDemoBookingId:
      cancelDemoBookingMutation.isPending &&
      typeof cancelDemoBookingMutation.variables === "string"
        ? cancelDemoBookingMutation.variables
        : null,
    setDoctorArrival: setDoctorArrivalMutation.mutate,
    isSettingArrival: setDoctorArrivalMutation.isPending,
  }
}
