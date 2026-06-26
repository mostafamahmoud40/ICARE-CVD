"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { patientKeys } from "@/lib/query-keys"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import { deleteConsultationReport } from "../../consultationReport.api"

export function useDeleteConsultationReport(patientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (visitId: string) => deleteConsultationReport(patientId, visitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: patientKeys.doctorRecord(patientId),
      })
      showIcareSuccessToast("Consultation deleted", "The visit was removed from the timeline.")
    },
    onError: (error: Error) => {
      showIcareErrorToast("Could not delete consultation", error.message)
    },
  })
}
