"use client"

import { useCallback, useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast } from "@/components/shared/icare-toast"
import type {
  Allergy,
  ChiefComplaintStructured,
  ConsultationData,
  ConsultationMedicalHistory,
  DiagnosisEntry,
  ExistingCondition,
  FamilyHistoryItem,
  HomeMeasurement,
  PhysicalExamFindings,
  PrescriptionEntry,
  ProcedureDetails,
  ReferralEntry,
  TestOrder,
} from "./consultation.types"
import {
  buildConsultationFieldPatch,
  cancelLabOrder,
  createConsultationReferral,
  createLabOrder,
  createMedication,
  createPatientAllergy,
  createPatientDiagnosis,
  createPatientFamilyHistory,
  deleteConsultationReferral,
  deleteMedication,
  deletePatientAllergy,
  deletePatientDiagnosis,
  deletePatientFamilyHistory,
  fetchConsultationSession,
  linkConsultationDiagnosis,
  linkConsultationPrescription,
  patchConsultation,
  updateConsultationPrescriptionLink,
  updateMedication,
  updatePatientDiagnosis,
} from "./consultation.api"
import {
  buildLabOrderPayload,
  mapSessionToLiveFields,
  mergeSessionLiveFields,
  prescriptionDurationToDays,
} from "./consultationLive.mapper"

const SAVE_DEBOUNCE_MS = 900

export function useConsultationLiveSections(
  queueEntryId: string,
  data: ConsultationData | null,
  setData: Dispatch<SetStateAction<ConsultationData | null>>,
  hydrated: boolean,
) {
  const queryClient = useQueryClient()
  const consultationIdRef = useRef<string | null>(null)
  const appointmentIdRef = useRef<string | null>(null)
  const patientIdRef = useRef<string | null>(null)
  const liveHydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef(false)
  const dataRef = useRef(data)
  dataRef.current = data

  const sessionQuery = useQuery({
    queryKey: ["consultation-session", queueEntryId],
    queryFn: () => fetchConsultationSession(queueEntryId),
    enabled: hydrated,
    staleTime: 30_000,
  })

  useEffect(() => {
    liveHydratedRef.current = false
  }, [queueEntryId])

  useEffect(() => {
    if (data?.patientId) {
      patientIdRef.current = data.patientId
    }
  }, [data?.patientId])

  const saveMutation = useMutation({
    mutationFn: async (patch: ReturnType<typeof buildConsultationFieldPatch>) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return
      await patchConsultation(patientId, consultationId, patch)
    },
    onError: () => {
      showIcareErrorToast(
        "Could not save consultation",
        "Your changes were not saved. Please try again.",
      )
    },
  })

  const persistFields = useCallback(
    (next: ConsultationData) => {
      if (!consultationIdRef.current) {
        pendingSaveRef.current = true
        return Promise.resolve()
      }
      pendingSaveRef.current = false
      return saveMutation.mutateAsync(
        buildConsultationFieldPatch({
          chiefComplaint: next.chiefComplaint,
          chiefComplaintStructured: next.chiefComplaintStructured,
          physicalExam: next.physicalExam,
          clinicalNotes: next.clinicalNotes,
          assessmentAndPlan: next.assessmentAndPlan,
          followUpDate: next.followUpDate,
          followUpNotes: next.followUpNotes,
          homeMeasurements: next.homeMeasurements,
          medicalHistory: next.medicalHistory,
          procedureDetails: next.procedureDetails,
          patientDiagnosisSummary: next.patientDiagnosisSummary,
          patientLifestyleAdvice: next.patientLifestyleAdvice,
          patientDangerSigns: next.patientDangerSigns,
        }),
      )
    },
    [saveMutation],
  )

  useEffect(() => {
    if (!sessionQuery.data || liveHydratedRef.current || !data) return

    liveHydratedRef.current = true
    consultationIdRef.current = sessionQuery.data.consultation.id
    patientIdRef.current = data.patientId
    appointmentIdRef.current = sessionQuery.data.consultation.appointmentId

    const liveFields = mapSessionToLiveFields(sessionQuery.data)
    setData((prev) => {
      if (!prev) return prev
      const next = mergeSessionLiveFields(prev, liveFields)
      dataRef.current = next
      return next
    })

    queueMicrotask(() => {
      const current = dataRef.current
      if (!current || !consultationIdRef.current) return
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        void persistFields(current)
      }
    })
  }, [sessionQuery.data, data, persistFields, setData])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const current = dataRef.current
      if (!current) return
      persistFields(current)
    }, SAVE_DEBOUNCE_MS)
  }, [persistFields])

  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const current = dataRef.current
    if (!current) return
    await persistFields(current)
  }, [persistFields])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const updateChiefComplaint = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, chiefComplaint: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateChiefComplaintStructured = useCallback(
    (value: ChiefComplaintStructured) => {
      setData((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          chiefComplaintStructured: value,
          structuredComplaint: value.primaryComplaint,
        }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateMedicalHistory = useCallback(
    (value: ConsultationMedicalHistory) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, medicalHistory: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateProcedureDetails = useCallback(
    <K extends keyof ProcedureDetails>(key: K, value: ProcedureDetails[K]) => {
      setData((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          procedureDetails: { ...prev.procedureDetails, [key]: value },
        }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateExam = useCallback(
    (key: keyof PhysicalExamFindings, value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          physicalExam: { ...prev.physicalExam, [key]: value },
        }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateClinicalNotes = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, clinicalNotes: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateAssessmentAndPlan = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, assessmentAndPlan: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateFollowUpDate = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, followUpDate: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updateFollowUpNotes = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, followUpNotes: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updatePatientDiagnosisSummary = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, patientDiagnosisSummary: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updatePatientLifestyleAdvice = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, patientLifestyleAdvice: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const updatePatientDangerSigns = useCallback(
    (value: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = { ...prev, patientDangerSigns: value }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const addDiagnosis = useCallback(
    async (entry: DiagnosisEntry) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return

      try {
        const created = await createPatientDiagnosis(patientId, {
          icdCode: entry.icdCode.trim() || "NOS",
          description: entry.description.trim(),
          type: entry.type,
          severity: entry.severity,
          clinicalNotes: entry.notes.trim() || undefined,
        })
        await linkConsultationDiagnosis(patientId, consultationId, {
          diagnosisId: created.id,
          type: entry.type,
          notes: entry.notes.trim() || undefined,
        })

        setData((prev) =>
          prev
            ? {
                ...prev,
                diagnoses: [
                  ...prev.diagnoses,
                  { ...entry, id: created.id, isAiSuggested: false },
                ],
              }
            : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not add diagnosis",
          "The diagnosis was not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const removeDiagnosis = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      setData((prev) =>
        prev
          ? { ...prev, diagnoses: prev.diagnoses.filter((d) => d.id !== id) }
          : prev,
      )

      try {
        await deletePatientDiagnosis(patientId, id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not remove diagnosis",
          "The diagnosis may still appear after refresh.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const updateDiagnosis = useCallback(
    async (id: string, entry: DiagnosisEntry) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      const previous = dataRef.current?.diagnoses.find((d) => d.id === id)
      setData((prev) =>
        prev
          ? {
              ...prev,
              diagnoses: prev.diagnoses.map((d) =>
                d.id === id ? { ...entry, id, isAiSuggested: d.isAiSuggested } : d,
              ),
            }
          : prev,
      )

      try {
        await updatePatientDiagnosis(patientId, id, {
          icdCode: entry.icdCode.trim() || "NOS",
          description: entry.description.trim(),
          type: entry.type,
          severity: entry.severity,
          clinicalNotes: entry.notes.trim() || undefined,
        })
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        if (previous) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  diagnoses: prev.diagnoses.map((d) => (d.id === id ? previous : d)),
                }
              : prev,
          )
        }
        showIcareErrorToast(
          "Could not update diagnosis",
          "Your changes were not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const addPrescription = useCallback(
    async (entry: PrescriptionEntry) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return

      try {
        const created = await createMedication(patientId, {
          name: entry.name.trim(),
          dose: entry.dose.trim(),
          frequency: entry.frequency.trim(),
          type: entry.type,
          instructions: entry.instructions.trim() || undefined,
          durationDays: prescriptionDurationToDays(entry.duration),
        })
        await linkConsultationPrescription(patientId, consultationId, {
          medicationId: created.id,
          duration: entry.duration,
          notes: entry.instructions.trim() || undefined,
        })

        setData((prev) =>
          prev
            ? {
                ...prev,
                prescriptions: [
                  ...prev.prescriptions,
                  { ...entry, id: created.id },
                ],
              }
            : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not add prescription",
          "The medication was not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const removePrescription = useCallback(
    async (id: string) => {
      setData((prev) =>
        prev
          ? { ...prev, prescriptions: prev.prescriptions.filter((p) => p.id !== id) }
          : prev,
      )

      try {
        await deleteMedication(id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not remove prescription",
          "The medication may still appear after refresh.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const updatePrescription = useCallback(
    async (id: string, entry: PrescriptionEntry) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return

      const previous = dataRef.current?.prescriptions.find((p) => p.id === id)
      setData((prev) =>
        prev
          ? {
              ...prev,
              prescriptions: prev.prescriptions.map((p) => (p.id === id ? { ...entry, id } : p)),
            }
          : prev,
      )

      try {
        await updateMedication(id, {
          name: entry.name.trim(),
          dose: entry.dose.trim(),
          frequency: entry.frequency.trim(),
          type: entry.type,
          instructions: entry.instructions.trim() || undefined,
          durationDays: prescriptionDurationToDays(entry.duration),
        })
        await updateConsultationPrescriptionLink(patientId, consultationId, id, {
          duration: entry.duration || undefined,
          notes: entry.instructions.trim() || undefined,
        })
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        if (previous) {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  prescriptions: prev.prescriptions.map((p) => (p.id === id ? previous : p)),
                }
              : prev,
          )
        }
        showIcareErrorToast(
          "Could not update prescription",
          "Your changes were not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const addAllergy = useCallback(
    async (entry: Allergy) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      try {
        const created = await createPatientAllergy(patientId, {
          category: entry.category,
          allergen: entry.allergen,
          reaction: entry.reaction,
        })
        setData((prev) =>
          prev
            ? {
                ...prev,
                patientSummary: {
                  ...prev.patientSummary,
                  allergies: [...prev.patientSummary.allergies, created],
                },
              }
            : prev,
        )
      } catch {
        showIcareErrorToast(
          "Could not add allergy",
          "The allergy was not saved. Please try again.",
        )
      }
    },
    [setData],
  )

  const removeAllergy = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      setData((prev) =>
        prev
          ? {
              ...prev,
              patientSummary: {
                ...prev.patientSummary,
                allergies: prev.patientSummary.allergies.filter((a) => a.id !== id),
              },
            }
          : prev,
      )

      try {
        await deletePatientAllergy(patientId, id)
      } catch {
        showIcareErrorToast(
          "Could not remove allergy",
          "The allergy may still appear after refresh.",
        )
      }
    },
    [setData],
  )

  const addChronicCondition = useCallback(
    async (entry: ExistingCondition) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      try {
        const created = await createPatientDiagnosis(patientId, {
          icdCode: "NOS",
          description: entry.name.trim(),
          type: "secondary",
          severity: "moderate",
          clinicalNotes: entry.details.trim() || undefined,
          status: "chronic",
        })

        const nextCondition: ExistingCondition = {
          ...entry,
          id: created.id,
        }

        setData((prev) =>
          prev
            ? {
                ...prev,
                patientSummary: {
                  ...prev.patientSummary,
                  existingConditions: [
                    ...prev.patientSummary.existingConditions,
                    nextCondition,
                  ],
                },
              }
            : prev,
        )
      } catch {
        showIcareErrorToast(
          "Could not add chronic condition",
          "The condition was not saved. Please try again.",
        )
      }
    },
    [setData],
  )

  const removeChronicCondition = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      setData((prev) =>
        prev
          ? {
              ...prev,
              patientSummary: {
                ...prev.patientSummary,
                existingConditions: prev.patientSummary.existingConditions.filter(
                  (c) => c.id !== id,
                ),
              },
            }
          : prev,
      )

      try {
        await deletePatientDiagnosis(patientId, id)
      } catch {
        showIcareErrorToast(
          "Could not remove chronic condition",
          "The condition may still appear after refresh.",
        )
      }
    },
    [setData],
  )

  const addFamilyHistory = useCallback(
    async (entry: FamilyHistoryItem) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      try {
        const created = await createPatientFamilyHistory(patientId, {
          relationship: entry.relationship,
          condition: entry.condition,
          details: entry.details,
        })
        setData((prev) =>
          prev
            ? {
                ...prev,
                patientSummary: {
                  ...prev.patientSummary,
                  familyHistory: [...prev.patientSummary.familyHistory, created],
                },
              }
            : prev,
        )
      } catch {
        showIcareErrorToast(
          "Could not add family history",
          "The entry was not saved. Please try again.",
        )
      }
    },
    [setData],
  )

  const removeFamilyHistory = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      setData((prev) =>
        prev
          ? {
              ...prev,
              patientSummary: {
                ...prev.patientSummary,
                familyHistory: prev.patientSummary.familyHistory.filter((f) => f.id !== id),
              },
            }
          : prev,
      )

      try {
        await deletePatientFamilyHistory(patientId, id)
      } catch {
        showIcareErrorToast(
          "Could not remove family history",
          "The entry may still appear after refresh.",
        )
      }
    },
    [setData],
  )

  const addTestOrder = useCallback(
    async (entry: TestOrder) => {
      const patientId = patientIdRef.current
      const appointmentId = appointmentIdRef.current
      if (!patientId || !appointmentId) return

      try {
        const created = await createLabOrder(
          patientId,
          buildLabOrderPayload(entry, appointmentId),
        )
        setData((prev) =>
          prev
            ? {
                ...prev,
                testOrders: [...prev.testOrders, { ...entry, id: created.id }],
              }
            : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not order test",
          "The lab order was not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const removeTestOrder = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      if (!patientId) return

      setData((prev) =>
        prev
          ? { ...prev, testOrders: prev.testOrders.filter((t) => t.id !== id) }
          : prev,
      )

      try {
        await cancelLabOrder(patientId, id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not cancel test order",
          "The order may still appear after refresh.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const addHomeMeasurement = useCallback(
    (entry: HomeMeasurement) => {
      setData((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          homeMeasurements: [...prev.homeMeasurements, entry],
        }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const removeHomeMeasurement = useCallback(
    (id: string) => {
      setData((prev) => {
        if (!prev) return prev
        const next = {
          ...prev,
          homeMeasurements: prev.homeMeasurements.filter((m) => m.id !== id),
        }
        dataRef.current = next
        scheduleSave()
        return next
      })
    },
    [scheduleSave, setData],
  )

  const addReferral = useCallback(
    async (entry: ReferralEntry) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return

      try {
        const created = await createConsultationReferral(patientId, consultationId, {
          specialty: entry.specialty,
          reason: entry.reason,
          urgency: entry.urgency,
        })
        setData((prev) =>
          prev
            ? {
                ...prev,
                referrals: [...prev.referrals, { ...entry, id: created.id }],
              }
            : prev,
        )
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not add referral",
          "The specialist referral was not saved. Please try again.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  const removeReferral = useCallback(
    async (id: string) => {
      const patientId = patientIdRef.current
      const consultationId = consultationIdRef.current
      if (!patientId || !consultationId) return

      setData((prev) =>
        prev
          ? { ...prev, referrals: prev.referrals.filter((r) => r.id !== id) }
          : prev,
      )

      try {
        await deleteConsultationReferral(patientId, consultationId, id)
        await queryClient.invalidateQueries({
          queryKey: ["consultation-session", queueEntryId],
        })
      } catch {
        showIcareErrorToast(
          "Could not remove referral",
          "The referral may still appear after refresh.",
        )
      }
    },
    [queueEntryId, queryClient, setData],
  )

  return {
    updateChiefComplaint,
    updateChiefComplaintStructured,
    updateMedicalHistory,
    updateProcedureDetails,
    updateExam,
    addDiagnosis,
    removeDiagnosis,
    updateDiagnosis,
    addPrescription,
    removePrescription,
    updatePrescription,
    addAllergy,
    removeAllergy,
    addFamilyHistory,
    removeFamilyHistory,
    addChronicCondition,
    removeChronicCondition,
    addTestOrder,
    removeTestOrder,
    addHomeMeasurement,
    removeHomeMeasurement,
    addReferral,
    removeReferral,
    updateClinicalNotes,
    updateAssessmentAndPlan,
    updateFollowUpDate,
    updateFollowUpNotes,
    updatePatientDiagnosisSummary,
    updatePatientLifestyleAdvice,
    updatePatientDangerSigns,
    saveNow,
    isSessionLoading: sessionQuery.isLoading,
    isSaving: saveMutation.isPending,
    isSessionReady: Boolean(consultationIdRef.current) || Boolean(sessionQuery.data),
    consultationId: sessionQuery.data?.consultation.id ?? null,
    patientId: data?.patientId ?? null,
  }
}
