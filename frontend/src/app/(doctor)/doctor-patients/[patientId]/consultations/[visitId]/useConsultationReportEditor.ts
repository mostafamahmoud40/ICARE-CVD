"use client"

import { useCallback, useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import {
  buildConsultationReportPatch,
  reportDraftFromConsultation,
  type ConsultationReportDraft,
} from "../../../consultationReportEditor"
import {
  deleteConsultationReport,
  updateConsultationReport,
} from "../../../consultationReport.api"
import type { ConsultationReport } from "../../../doctorPatients.types"

export function useConsultationReportEditor(
  patientId: string,
  visitId: string,
  report: ConsultationReport,
) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ConsultationReportDraft>(() =>
    reportDraftFromConsultation(report),
  )

  useEffect(() => {
    if (!isEditing) {
      setDraft(reportDraftFromConsultation(report))
    }
  }, [report, isEditing])

  const reportQueryKey = ["consultation-report", patientId, visitId]
  const patientQueryKey = ["doctor-patient-record", patientId]

  const saveMutation = useMutation({
    mutationFn: async () => updateConsultationReport(patientId, visitId, buildConsultationReportPatch(draft)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: reportQueryKey }),
        queryClient.invalidateQueries({ queryKey: patientQueryKey }),
      ])
      setIsEditing(false)
      showIcareSuccessToast("Report updated", "Consultation report changes were saved.")
    },
    onError: (error: Error) => {
      showIcareErrorToast("Could not save report", error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => deleteConsultationReport(patientId, visitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientQueryKey })
      showIcareSuccessToast("Consultation deleted", "The visit record was removed.")
      router.push(`/doctor-patients/${patientId}/consultations`)
    },
    onError: (error: Error) => {
      showIcareErrorToast("Could not delete consultation", error.message)
    },
  })

  const startEditing = useCallback(() => {
    setDraft(reportDraftFromConsultation(report))
    setIsEditing(true)
  }, [report])

  const cancelEditing = useCallback(() => {
    setDraft(reportDraftFromConsultation(report))
    setIsEditing(false)
  }, [report])

  const updateDraft = useCallback(
    (patch: Partial<ConsultationReportDraft>) => {
      setDraft((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const updateAiStudy = useCallback(
    (
      studyId: string,
      patch: Partial<ConsultationReportDraft["aiStudies"][number]>,
    ) => {
      setDraft((prev) => ({
        ...prev,
        aiStudies: prev.aiStudies.map((study) =>
          study.id === studyId ? { ...study, ...patch } : study,
        ),
      }))
    },
    [],
  )

  const removeAiStudy = useCallback((studyId: string) => {
    setDraft((prev) => ({
      ...prev,
      aiStudies: prev.aiStudies.map((study) =>
        study.id === studyId ? { ...study, hidden: true } : study,
      ),
    }))
  }, [])

  return {
    isEditing,
    draft,
    startEditing,
    cancelEditing,
    updateDraft,
    updateAiStudy,
    removeAiStudy,
    saveReport: () => saveMutation.mutate(),
    deleteReport: () => deleteMutation.mutate(),
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
