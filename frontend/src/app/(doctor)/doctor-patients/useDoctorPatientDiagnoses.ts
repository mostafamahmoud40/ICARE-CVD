"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { showIcareErrorToast } from "@/components/shared/icare-toast"
import type { DiagnosisFormValues } from "./[patientId]/diagnoses/diagnosisForm.types"
import {
  createDoctorPatientDiagnosis,
  deleteDoctorPatientDiagnosis,
  diagnosisFormToApiPayload,
  updateDoctorPatientDiagnosis,
} from "./doctorPatientClinical.api"

function recordQueryKey(patientId: string) {
  return ["doctor-patient-record", patientId] as const
}

export function useDoctorPatientDiagnoses(patientId: string) {
  const queryClient = useQueryClient()

  const invalidateRecord = () =>
    queryClient.invalidateQueries({ queryKey: recordQueryKey(patientId) })

  const createMutation = useMutation({
    mutationFn: (values: DiagnosisFormValues) =>
      createDoctorPatientDiagnosis(patientId, diagnosisFormToApiPayload(values)),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not save diagnosis", "The diagnosis was not created.")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      diagnosisId,
      values,
    }: {
      diagnosisId: string
      values: DiagnosisFormValues
    }) =>
      updateDoctorPatientDiagnosis(patientId, diagnosisId, diagnosisFormToApiPayload(values)),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not update diagnosis", "Changes were not saved.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (diagnosisId: string) => deleteDoctorPatientDiagnosis(patientId, diagnosisId),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not delete diagnosis", "The diagnosis was not removed.")
    },
  })

  return {
    createDiagnosis: createMutation.mutateAsync,
    updateDiagnosis: updateMutation.mutateAsync,
    deleteDiagnosis: deleteMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
