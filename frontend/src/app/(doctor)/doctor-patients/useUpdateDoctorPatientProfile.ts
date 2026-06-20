"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  updateDoctorPatientProfile,
  type UpdateDoctorPatientProfilePayload,
} from "./doctorPatients.api"
import type { PatientFullRecord } from "./doctorPatients.types"

export function useUpdateDoctorPatientProfile(patientId: string) {
  const queryClient = useQueryClient()
  const queryKey = ["doctor-patient-record", patientId] as const

  const { mutateAsync: updateProfile, isPending: isUpdating } = useMutation({
    mutationKey: [...queryKey, "update"],
    mutationFn: (payload: UpdateDoctorPatientProfilePayload) =>
      updateDoctorPatientProfile(patientId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData<PatientFullRecord>(queryKey, data)
      queryClient.invalidateQueries({ queryKey: ["doctor-patients"] })
      showIcareSuccessToast("Profile updated", "Patient details were saved.")
    },
  })

  return { updateProfile, isUpdating }
}
