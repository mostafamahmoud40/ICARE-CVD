"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { showIcareErrorToast } from "@/components/shared/icare-toast"
import type { MedicationRecord } from "./doctorPatients.types"
import {
  changeDoctorPatientMedicationStatus,
  createDoctorPatientMedication,
  updateDoctorPatientMedication,
  type DoctorMedicationWritePayload,
} from "./doctorPatientClinical.api"

function recordQueryKey(patientId: string) {
  return ["doctor-patient-record", patientId] as const
}

export type DoctorMedicationFormPayload = {
  name: string
  dose: string
  frequency: string
  type: MedicationRecord["type"]
  status: MedicationRecord["status"]
  compliance: NonNullable<MedicationRecord["compliance"]> | "unknown"
  timeOfDay: Array<"morning" | "afternoon" | "evening">
  startDate: string
  durationDays: number | null
  instructions: string
  sideEffects: string
}

function toWritePayload(data: DoctorMedicationFormPayload): DoctorMedicationWritePayload {
  return {
    name: data.name.trim(),
    dose: data.dose.trim(),
    frequency: data.frequency.trim(),
    type: data.type || "other",
    sideEffects: data.sideEffects.trim() || undefined,
    instructions: data.instructions.trim() || undefined,
    timeOfDay: data.timeOfDay,
    durationDays: data.durationDays,
    startDate: data.startDate || undefined,
    compliance: data.compliance === "unknown" ? undefined : data.compliance,
  }
}

export function useDoctorPatientMedications(patientId: string) {
  const queryClient = useQueryClient()

  const invalidateRecord = () =>
    queryClient.invalidateQueries({ queryKey: recordQueryKey(patientId) })

  const createMutation = useMutation({
    mutationFn: async (values: DoctorMedicationFormPayload) => {
      const created = await createDoctorPatientMedication(patientId, toWritePayload(values))
      if (values.status !== "active") {
        await changeDoctorPatientMedicationStatus(created.id, values.status)
      }
      return created
    },
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not prescribe medication", "The medication was not saved.")
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      medicationId,
      values,
      previousStatus,
    }: {
      medicationId: string
      values: DoctorMedicationFormPayload
      previousStatus: MedicationRecord["status"]
    }) => {
      await updateDoctorPatientMedication(medicationId, toWritePayload(values))
      if (values.status !== previousStatus) {
        await changeDoctorPatientMedicationStatus(medicationId, values.status)
      }
    },
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not update medication", "Changes were not saved.")
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      medicationId,
      status,
      sideEffects,
    }: {
      medicationId: string
      status: MedicationRecord["status"]
      sideEffects?: string
    }) =>
      Promise.all([
        changeDoctorPatientMedicationStatus(medicationId, status),
        sideEffects
          ? updateDoctorPatientMedication(medicationId, { sideEffects })
          : Promise.resolve(),
      ]),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not update medication status", "The status was not changed.")
    },
  })

  const flagMutation = useMutation({
    mutationFn: ({
      medicationId,
      flagReason,
    }: {
      medicationId: string
      flagReason: string
    }) =>
      updateDoctorPatientMedication(medicationId, {
        compliance: "poor",
        instructions: flagReason.trim() || undefined,
      }),
    onSuccess: invalidateRecord,
    onError: () => {
      showIcareErrorToast("Could not flag medication", "The adherence flag was not saved.")
    },
  })

  return {
    createMedication: createMutation.mutateAsync,
    updateMedication: updateMutation.mutateAsync,
    changeMedicationStatus: statusMutation.mutateAsync,
    flagMedication: flagMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isUpdatingStatus: statusMutation.isPending,
    isFlagging: flagMutation.isPending,
  }
}
