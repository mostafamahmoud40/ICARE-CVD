"use client"

import { useMemo, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  Medication,
  DoseLog,
  MedicationsPageData,
  MedicationStats,
} from "./medications.types"

type MedicationApiRow = {
  id: string
  name: string
  dose: string
  frequency: string
  type: string
  compliance: "good" | "poor" | null
  sideEffects: string | null
  status: "active" | "paused" | "discontinued"
  instructions: string | null
  timeOfDay: ("morning" | "afternoon" | "evening")[]
  adherencePercent: number
  startDate: string | null
  durationDays: number | null
  endDate: string | null
  prescribedAt: string
  prescribedBy: string | null
  updatedAt: string
}

type DoseLogApiRow = {
  id: string
  medicationId: string
  takenAt: string
  skipped: boolean
}

function mapMedication(row: MedicationApiRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dose: row.dose,
    frequency: row.frequency,
    type: row.type as Medication["type"],
    compliance: row.compliance ?? undefined,
    sideEffects: row.sideEffects ?? undefined,
    status: row.status,
    prescribedBy: row.prescribedBy ?? "Doctor",
    prescribedAt: row.prescribedAt,
    instructions: row.instructions ?? undefined,
    timeOfDay: row.timeOfDay,
    adherencePercent: row.adherencePercent,
    startDate: row.startDate ?? undefined,
    durationDays: row.durationDays ?? undefined,
    endDate: row.endDate ?? undefined,
    remainingRefills: 0,
  }
}

function computeStats(medications: Medication[], doseLogs: DoseLog[]): MedicationStats {
  const active = medications.filter((m) => m.status === "active")
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const takenToday = doseLogs.filter(
    (l) => !l.skipped && new Date(l.takenAt) >= todayStart,
  ).length

  const totalDosesToday = active.reduce((sum, m) => sum + m.timeOfDay.length, 0)

  const last7Days = doseLogs.filter((l) => {
    const d = new Date(l.takenAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })
  const taken7 = last7Days.filter((l) => !l.skipped).length
  const adherencePercent =
    last7Days.length > 0 ? Math.round((taken7 / last7Days.length) * 100) : 100

  return {
    totalActive: active.length,
    takenToday,
    dueToday: totalDosesToday,
    adherencePercent,
  }
}

async function fetchMedications(): Promise<MedicationsPageData> {
  const [medsResult, logsResult] = await Promise.allSettled([
    apiClient.get<MedicationApiRow[]>("/patient/medications"),
    // Fetch dose logs for all medications in parallel after we get them
    Promise.resolve({ data: [] as DoseLogApiRow[] }),
  ])

  const medications =
    medsResult.status === "fulfilled" ? medsResult.value.data.map(mapMedication) : []

  // Fetch dose logs for each medication
  const doseLogs: DoseLog[] = []
  if (medications.length > 0) {
    const logPromises = medications.map((med) =>
      apiClient.get<DoseLogApiRow[]>(`/patient/medications/${med.id}/logs`).catch(() => ({
        data: [] as DoseLogApiRow[],
      })),
    )
    const logResults = await Promise.allSettled(logPromises)
    for (const res of logResults) {
      if (res.status === "fulfilled") {
        doseLogs.push(
          ...res.value.data.map((l) => ({
            id: l.id,
            medicationId: l.medicationId,
            takenAt: l.takenAt,
            skipped: l.skipped,
          })),
        )
      }
    }
  }

  const stats = computeStats(medications, doseLogs)

  return { medications, doseLog: doseLogs, stats }
}

export function useMedications() {
  const queryClient = useQueryClient()
  const queryKey = ["patient-medications"]

  const query = useQuery<MedicationsPageData, Error>({
    queryKey,
    queryFn: fetchMedications,
    staleTime: 2 * 60 * 1000,
  })

  const takeMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const { data } = await apiClient.post(`/patient/medications/${medicationId}/take`)
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const skipMutation = useMutation({
    mutationFn: async (medicationId: string) => {
      const { data } = await apiClient.post(`/patient/medications/${medicationId}/skip`)
      return data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const markAsTaken = useCallback(
    (medicationId: string) => takeMutation.mutateAsync(medicationId),
    [takeMutation],
  )

  const markAsSkipped = useCallback(
    (medicationId: string) => skipMutation.mutateAsync(medicationId),
    [skipMutation],
  )

  return {
    ...query,
    data: query.data ?? { medications: [], doseLog: [], stats: { totalActive: 0, takenToday: 0, dueToday: 0, adherencePercent: 100 } },
    markAsTaken,
    markAsSkipped,
  }
}
