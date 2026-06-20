"use client"

import { useMemo, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type {
  PatientInfo,
  PatientPrescription,
  DoctorPrescriptionsPageData,
  PrescriptionStats,
  AddPrescriptionPayload,
  UpdatePrescriptionPayload,
} from "./doctorPrescriptions.types"

type PatientApiRow = {
  patientId: string
  fullName: string
  dateOfBirth: string
  gender: "male" | "female" | "other"
  activeMedications: number
  poorComplianceCount: number
  avatarUrl?: string | null
}

type PrescriptionApiRow = {
  id: string
  patientId: number
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
  lastTakenAt: string | null
  createdAt: string
  updatedAt: string
}

type StatsApiRow = {
  totalMedications: number
  activePrescriptions: number
  poorComplianceCount: number
}

function mapPatient(row: PatientApiRow): PatientInfo {
  return {
    id: row.patientId,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender === "other" ? "male" : row.gender,
    activeMedications: row.activeMedications,
    poorComplianceCount: row.poorComplianceCount,
    avatarUrl: row.avatarUrl,
  }
}

function mapPrescription(row: PrescriptionApiRow): PatientPrescription {
  return {
    id: row.id,
    patientId: String(row.patientId),
    name: row.name,
    dose: row.dose,
    frequency: row.frequency,
    type: row.type as PatientPrescription["type"],
    compliance: row.compliance ?? "good",
    sideEffects: row.sideEffects ?? undefined,
    status: row.status,
    prescribedAt: row.prescribedAt,
    instructions: row.instructions ?? undefined,
    timeOfDay: row.timeOfDay,
    adherencePercent: row.adherencePercent,
    startDate: row.startDate ?? undefined,
    durationDays: row.durationDays ?? undefined,
    endDate: row.endDate ?? undefined,
    lastTakenAt: row.lastTakenAt ?? undefined,
  }
}

function computeStats(patients: PatientInfo[], prescriptions: PatientPrescription[]): PrescriptionStats {
  return {
    totalPatients: patients.length,
    totalPrescriptions: prescriptions.length,
    activePrescriptions: prescriptions.filter((p) => p.status === "active").length,
    poorComplianceCount: prescriptions.filter(
      (p) => p.compliance === "poor" && p.status === "active",
    ).length,
  }
}

async function fetchDoctorPrescriptions(): Promise<DoctorPrescriptionsPageData> {
  const [patientsResult, statsResult] = await Promise.allSettled([
    apiClient.get<PatientApiRow[]>("/doctor/medications/patients"),
    apiClient.get<StatsApiRow>("/doctor/medications/stats"),
  ])

  const patients =
    patientsResult.status === "fulfilled"
      ? patientsResult.value.data.map(mapPatient)
      : []

  // Fetch all prescriptions for each patient
  const prescriptions: PatientPrescription[] = []
  if (patients.length > 0) {
    const rxPromises = patients.map((p) =>
      apiClient
        .get<PrescriptionApiRow[]>(`/doctor/medications/patients/${p.id}`)
        .catch(() => ({ data: [] as PrescriptionApiRow[] })),
    )
    const rxResults = await Promise.allSettled(rxPromises)
    for (const res of rxResults) {
      if (res.status === "fulfilled") {
        prescriptions.push(...res.value.data.map(mapPrescription))
      }
    }
  }

  const stats = computeStats(patients, prescriptions)

  return { patients, prescriptions, stats }
}

export function useDoctorPrescriptions() {
  const queryClient = useQueryClient()
  const queryKey = ["doctor-prescriptions"]

  const query = useQuery<DoctorPrescriptionsPageData, Error>({
    queryKey,
    queryFn: fetchDoctorPrescriptions,
    staleTime: 2 * 60 * 1000,
  })

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["doctor", "medications", "patients"] }),
    ])
  }, [queryClient, queryKey])

  const addPrescription = useCallback(
    async (payload: AddPrescriptionPayload) => {
      await apiClient.post(`/doctor/medications/patients/${payload.patientId}`, {
        name: payload.name,
        dose: payload.dose,
        frequency: payload.frequency,
        type: payload.type,
        sideEffects: payload.sideEffects,
        instructions: payload.instructions,
        timeOfDay: payload.timeOfDay,
        durationDays: payload.durationDays ?? null,
        startDate: payload.startDate ?? new Date().toISOString().split("T")[0],
      })
      await invalidate()
    },
    [invalidate],
  )

  const updatePrescription = useCallback(
    async (prescriptionId: string, payload: UpdatePrescriptionPayload) => {
      await apiClient.patch(`/doctor/medications/${prescriptionId}`, payload)
      await invalidate()
    },
    [invalidate],
  )

  const pausePrescription = useCallback(
    async (prescriptionId: string) => {
      await apiClient.patch(`/doctor/medications/${prescriptionId}/status`, {
        status: "paused",
      })
      await invalidate()
    },
    [invalidate],
  )

  const resumePrescription = useCallback(
    async (prescriptionId: string) => {
      await apiClient.patch(`/doctor/medications/${prescriptionId}/status`, {
        status: "active",
      })
      await invalidate()
    },
    [invalidate],
  )

  const discontinuePrescription = useCallback(
    async (prescriptionId: string) => {
      await apiClient.patch(`/doctor/medications/${prescriptionId}/status`, {
        status: "discontinued",
      })
      await invalidate()
    },
    [invalidate],
  )

  const deletePrescription = useCallback(
    async (prescriptionId: string) => {
      await apiClient.delete(`/doctor/medications/${prescriptionId}`)
      await invalidate()
    },
    [invalidate],
  )

  return {
    ...query,
    data: query.data ?? {
      patients: [],
      prescriptions: [],
      stats: { totalPatients: 0, totalPrescriptions: 0, activePrescriptions: 0, poorComplianceCount: 0 },
    },
    addPrescription,
    updatePrescription,
    pausePrescription,
    resumePrescription,
    discontinuePrescription,
    deletePrescription,
  }
}
