"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createPatientCareGoal,
  createPatientClinicalNote,
  deletePatientCareGoal,
  deletePatientClinicalNote,
  type CreatePatientCareGoalPayload,
  type CreatePatientClinicalNotePayload,
  type UpdatePatientCareGoalPayload,
  updatePatientCareGoal,
} from "./doctorPatients.api"
import { showIcareErrorToast } from "@/components/shared/icare-toast"

function recordQueryKey(patientId: string) {
  return ["doctor-patient-record", patientId] as const
}

export function usePatientProfileExtras(patientId: string) {
  const queryClient = useQueryClient()

  const invalidateRecord = () =>
    queryClient.invalidateQueries({ queryKey: recordQueryKey(patientId) })

  const createNoteMutation = useMutation({
    mutationFn: (payload: CreatePatientClinicalNotePayload) =>
      createPatientClinicalNote(patientId, payload),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not save note", "Clinical note was not saved.")
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deletePatientClinicalNote(patientId, noteId),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not delete note", "Clinical note was not removed.")
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: (payload: CreatePatientCareGoalPayload) =>
      createPatientCareGoal(patientId, payload),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not save goal", "Care goal was not saved.")
    },
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({
      goalId,
      payload,
    }: {
      goalId: string
      payload: UpdatePatientCareGoalPayload
    }) => updatePatientCareGoal(patientId, goalId, payload),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not update goal", "Care goal was not updated.")
    },
  })

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => deletePatientCareGoal(patientId, goalId),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not delete goal", "Care goal was not removed.")
    },
  })

  return {
    createClinicalNote: createNoteMutation.mutateAsync,
    deleteClinicalNote: deleteNoteMutation.mutateAsync,
    createCareGoal: createGoalMutation.mutateAsync,
    updateCareGoal: updateGoalMutation.mutateAsync,
    deleteCareGoal: deleteGoalMutation.mutateAsync,
    isSavingNote: createNoteMutation.isPending,
    isSavingGoal: createGoalMutation.isPending || updateGoalMutation.isPending,
    isDeletingNote: deleteNoteMutation.isPending,
    isDeletingGoal: deleteGoalMutation.isPending,
  }
}
