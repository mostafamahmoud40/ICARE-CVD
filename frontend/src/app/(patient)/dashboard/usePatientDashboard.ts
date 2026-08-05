"use client"

import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  listPatientCareTasks,
  mergeCareTimelineItems,
  PATIENT_CARE_TASKS_STORAGE_KEY,
} from "@/lib/patientCareTimelineBridge"

import { fetchPatientDashboard } from "./patientDashboard.api"
import type { PatientDashboardData } from "./dashboard.types"

export function usePatientDashboard() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === PATIENT_CARE_TASKS_STORAGE_KEY) {
        queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] })
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [queryClient])

  return useQuery<PatientDashboardData, Error>({
    queryKey: ["patient-dashboard"],
    queryFn: async () => {
      const dashboard = await fetchPatientDashboard()
      const orderedTasks = listPatientCareTasks(dashboard.patient.id)

      return {
        ...dashboard,
        careTimeline: mergeCareTimelineItems(dashboard.careTimeline, orderedTasks),
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}
