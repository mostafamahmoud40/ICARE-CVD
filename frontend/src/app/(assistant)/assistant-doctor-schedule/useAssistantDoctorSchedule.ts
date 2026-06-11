"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { doctorScheduleSchema } from "@/app/(doctor)/doctor-schedule/doctorSchedule.schema"
import type { DoctorSchedulePayload, WeekdayId } from "@/app/(doctor)/doctor-schedule/doctorSchedule.types"
import { apiClient } from "@/lib/api-client"

import { computeAvailableSlotsForDay } from "./assistantDoctorSchedule.slots"
import type {
  AssistantDoctorScheduleBundle,
  AssistantScheduleDoctor,
  ScheduleBooking,
  ScheduleDayExtra,
} from "./assistantDoctorSchedule.types"

export const assistantDoctorScheduleQueryKey = (doctorId: string) =>
  ["assistant-doctor-schedule", doctorId] as const

export const assistantScheduleDoctorsKey = ["assistant-schedule-doctors"] as const

async function fetchScheduleDoctors(): Promise<AssistantScheduleDoctor[]> {
  const { data } = await apiClient.get<AssistantScheduleDoctor[]>(
    "/assistant/appointments/doctors",
  )
  return data
}

async function fetchScheduleBundle(doctorId: string): Promise<AssistantDoctorScheduleBundle> {
  const { data } = await apiClient.get<AssistantDoctorScheduleBundle>(
    `/assistant/doctors/${doctorId}/schedule`,
  )
  return {
    ...data,
    schedule: doctorScheduleSchema.parse(data.schedule),
    pausedPeriodIds: data.pausedPeriodIds ?? [],
    bookings: data.bookings ?? [],
    doctorArrivalByWeekday: data.doctorArrivalByWeekday ?? {},
    dayExtras: data.dayExtras ?? [],
  }
}

async function persistSchedule(
  doctorId: string,
  schedule: DoctorSchedulePayload,
): Promise<DoctorSchedulePayload> {
  const validated = doctorScheduleSchema.parse(schedule)
  const { data } = await apiClient.put<DoctorSchedulePayload>(
    `/assistant/doctors/${doctorId}/schedule`,
    validated,
  )
  return doctorScheduleSchema.parse(data)
}

function toScheduledAtIso(scheduledDate: string, startTime: string): string {
  const [year, month, day] = scheduledDate.split("-").map(Number)
  const [hours, minutes] = startTime.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
}

export type AiChatHistoryItem = { role: "user" | "assistant"; content: string }

export async function sendScheduleAiMessage(
  doctorId: string,
  doctorName: string,
  message: string,
  history: AiChatHistoryItem[],
): Promise<string> {
  const { data } = await apiClient.post<{ reply: string }>(
    `/assistant/doctors/${doctorId}/schedule/ai/chat`,
    { message, doctorName, history },
  )
  return data.reply
}

export type ScheduleAiAnalysisResult = {
  insights: string[]
  risks: string[]
  recommendations: string[]
}

export async function runScheduleAiAnalysis(
  doctorId: string,
  doctorName: string,
): Promise<ScheduleAiAnalysisResult> {
  const { data } = await apiClient.post<ScheduleAiAnalysisResult>(
    `/assistant/doctors/${doctorId}/schedule/ai/analyze`,
    { doctorName },
  )
  return data
}

export function useAssistantScheduleDoctors() {
  return useQuery({
    queryKey: assistantScheduleDoctorsKey,
    queryFn: fetchScheduleDoctors,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAssistantDoctorSchedule(doctorId: string) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: assistantDoctorScheduleQueryKey(doctorId),
    queryFn: () => fetchScheduleBundle(doctorId),
    enabled: doctorId.length > 0,
    staleTime: 30 * 1000,
  })

  const saveScheduleMutation = useMutation({
    mutationFn: (schedule: DoctorSchedulePayload) => persistSchedule(doctorId, schedule),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Schedule updated", {
        description: "Weekly availability has been saved to the database.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not save", { description: e.message })
    },
  })

  const moveBookingMutation = useMutation({
    mutationFn: async ({
      bookingId,
      startTime,
      endTime,
      schedule,
      bookings,
    }: {
      bookingId: string
      startTime: string
      endTime: string
      schedule: DoctorSchedulePayload
      bookings: ScheduleBooking[]
    }) => {
      const booking = bookings.find((b) => b.id === bookingId)
      if (!booking) {
        throw new Error("Booking not found.")
      }
      const day = schedule.days.find((d) => d.weekday === booking.weekday)
      if (!day?.enabled) {
        throw new Error("That weekday is closed in the current draft.")
      }

      const bundle = query.data
      const extraPeriods =
        bundle?.dayExtras
          .filter((e) => e.date === booking.scheduledDate)
          .map((e) => ({ startTime: e.startTime, endTime: e.endTime })) ?? []
      const available = computeAvailableSlotsForDay({
        day,
        slotDurationMinutes: schedule.slotDurationMinutes,
        bufferBetweenSlotsMinutes: schedule.bufferBetweenSlotsMinutes,
        pausedPeriodIds: bundle?.pausedPeriodIds ?? [],
        bookings,
        weekday: booking.weekday,
        scheduledDate: booking.scheduledDate,
        excludeBookingId: bookingId,
        doctorArrivalTime: bundle?.doctorArrivalByWeekday[booking.weekday],
        extraPeriods,
      })
      const ok = available.some((s) => s.startTime === startTime && s.endTime === endTime)
      if (!ok) {
        throw new Error("That time is not available.")
      }

      const scheduledAt = toScheduledAtIso(booking.scheduledDate, startTime)
      await apiClient.patch(`/assistant/appointments/${bookingId}`, { scheduledAt })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Booking moved", {
        description: "The patient appointment has been rescheduled.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not move booking", { description: e.message })
    },
  })

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiClient.patch(`/assistant/appointments/${bookingId}/status`, {
        status: "cancelled",
      })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Booking cancelled", {
        description: "The appointment was cancelled and the slot is free again.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not cancel booking", { description: e.message })
    },
  })

  const togglePeriodPauseMutation = useMutation({
    mutationFn: async (periodId: string) => {
      const { data } = await apiClient.patch<{
        periodId: string
        paused: boolean
        pausedPeriodIds: string[]
      }>(`/assistant/doctors/${doctorId}/schedule/paused-periods/${encodeURIComponent(periodId)}`)
      return data
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success(res.paused ? "Session paused" : "Session resumed", {
        description: res.paused
          ? "Bookings should not use this window until you resume it."
          : "This working window is active again.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not update session", { description: e.message })
    },
  })

  const createDayExtraMutation = useMutation({
    mutationFn: async (payload: {
      date: string
      startTime: string
      endTime: string
      reason?: string
    }) => {
      const { data } = await apiClient.post<ScheduleDayExtra>(
        `/assistant/doctors/${doctorId}/schedule/day-extras`,
        payload,
      )
      return data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Extra hours added", {
        description: "These hours apply to this date only. The weekly schedule is unchanged.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not add extra hours", { description: e.message })
    },
  })

  const deleteDayExtraMutation = useMutation({
    mutationFn: async (extraId: string) => {
      await apiClient.delete(`/assistant/doctors/${doctorId}/schedule/day-extras/${extraId}`)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: assistantDoctorScheduleQueryKey(doctorId) })
      toast.success("Extra hours removed", {
        description: "Bookings already made in that window are not cancelled.",
      })
    },
    onError: (e: Error) => {
      toast.error("Could not remove extra hours", { description: e.message })
    },
  })

  const setDoctorArrivalMutation = useMutation({
    mutationFn: async ({
      weekday,
      arrivalTime,
    }: {
      weekday: WeekdayId
      arrivalTime: string | null
    }) => {
      const { data } = await apiClient.patch<{
        weekday: WeekdayId
        arrivalTime: string | null
      }>(`/assistant/doctors/${doctorId}/schedule/arrival`, { weekday, arrivalTime })
      return data
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
    moveBookingAsync: moveBookingMutation.mutateAsync,
    isMovingBooking: moveBookingMutation.isPending,
    cancelBooking: cancelBookingMutation.mutate,
    isCancellingBooking: cancelBookingMutation.isPending,
    cancellingBookingId:
      cancelBookingMutation.isPending &&
      typeof cancelBookingMutation.variables === "string"
        ? cancelBookingMutation.variables
        : null,
    setDoctorArrival: setDoctorArrivalMutation.mutate,
    isSettingArrival: setDoctorArrivalMutation.isPending,
    createDayExtraAsync: createDayExtraMutation.mutateAsync,
    isCreatingDayExtra: createDayExtraMutation.isPending,
    deleteDayExtra: deleteDayExtraMutation.mutate,
    isDeletingDayExtra: deleteDayExtraMutation.isPending,
    deletingDayExtraId:
      deleteDayExtraMutation.isPending &&
      typeof deleteDayExtraMutation.variables === "string"
        ? deleteDayExtraMutation.variables
        : null,
  }
}
