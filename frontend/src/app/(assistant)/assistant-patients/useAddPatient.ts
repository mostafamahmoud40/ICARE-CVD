"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import type { ZodIssue } from "zod"

import { apiClient } from "@/lib/api-client"

import type { StudyKind } from "../assistant-queue/assistantQueue.documents.types"
import { uploadAssistantPatientDocument, uploadPatientAvatar } from "./addPatient.upload"
import {
  deleteAddPatientDraft,
  getAddPatientDraft,
  isAddPatientDraftEmpty,
  listAddPatientDrafts,
  saveAddPatientDraft,
  type AddPatientDraft,
} from "./addPatient.drafts"
import { addPatientSchema } from "./addPatient.schema"
import type {
  AddPatientApiResponse,
  AddPatientFieldErrors,
  AddPatientFormValues,
  AllergyItem,
  CreatedPatient,
  MedicationItem,
  PendingPatientDocument,
} from "./addPatient.types"

const defaultValues: AddPatientFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  nationalId: "",
  bloodType: "",
  address: "",
  heightCm: "",
  weightKg: "",
  smokingStatus: "",
  alcoholConsumption: "",
  exerciseFrequency: "",
  stressLevel: "",
  maritalStatus: "",
  occupation: "",
  caffeineIntake: "",
  recreationalDrugUse: "",
  exerciseDuration: "",
  exerciseType: "",
  physicalActivityLevel: "",
  dietaryHabits: "",
  chiefComplaint: "",
  otherChiefComplaint: "",
  medicalHistoryNotes: "",
  avatarUrl: "",
  medications: [],
  allergies: [],
}

function toFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<AddPatientFieldErrors>((acc, issue) => {
    const field = issue.path[0]
    if (typeof field === "string") {
      acc[field as keyof AddPatientFormValues] = issue.message
    }
    return acc
  }, {})
}

export function useAddPatient() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<AddPatientFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<AddPatientFieldErrors>({})
  const [pendingDocuments, setPendingDocuments] = useState<PendingPatientDocument[]>([])
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [documentStudyKind, setDocumentStudyKind] = useState<StudyKind>("xray")
  const [drafts, setDrafts] = useState<AddPatientDraft[]>([])
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)

  useEffect(() => {
    setDrafts(listAddPatientDrafts())
  }, [])

  const refreshDrafts = () => {
    setDrafts(listAddPatientDrafts())
  }

  const { data: patientsFromDb, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["assistant-patients"],
    queryFn: async () => {
      const { data } = await apiClient.get<CreatedPatient[]>("/assistant/patients")
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async ({
      formValues,
      documents,
      avatarFile,
    }: {
      formValues: AddPatientFormValues
      documents: PendingPatientDocument[]
      avatarFile: File | null
      draftIdToClear?: string | null
    }) => {
      const presetAvatarUrl = avatarFile
        ? undefined
        : formValues.avatarUrl.trim() || undefined

      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        dateOfBirth: formValues.dateOfBirth || undefined,
        gender: formValues.gender || undefined,
        nationalId: formValues.nationalId || undefined,
        bloodType: formValues.bloodType || undefined,
        address: formValues.address || undefined,
        avatarUrl: presetAvatarUrl,
        heightCm: formValues.heightCm ? parseFloat(formValues.heightCm) : undefined,
        weightKg: formValues.weightKg ? parseFloat(formValues.weightKg) : undefined,
        smokingStatus: formValues.smokingStatus || undefined,
        alcoholConsumption: formValues.alcoholConsumption || undefined,
        exerciseFrequency: formValues.exerciseFrequency || undefined,
        stressLevel: formValues.stressLevel || undefined,
        chiefComplaint: formValues.chiefComplaint || undefined,
        otherChiefComplaint: formValues.otherChiefComplaint || undefined,
        medicalHistoryNotes: formValues.medicalHistoryNotes || undefined,
        maritalStatus: formValues.maritalStatus || undefined,
        occupation: formValues.occupation || undefined,
        medications: formValues.medications.length > 0 ? formValues.medications : undefined,
        allergies: formValues.allergies.length > 0 ? formValues.allergies : undefined,
      }
      const { data } = await apiClient.post<AddPatientApiResponse>("/assistant/patients", payload)

      if (avatarFile) {
        try {
          await uploadPatientAvatar(data.patient.id, avatarFile)
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? `Patient created but profile photo could not be uploaded. ${err.message}`
              : "Patient created but profile photo could not be uploaded.",
          )
        }
      }

      if (documents.length > 0) {
        const failures: string[] = []
        for (const doc of documents) {
          try {
            await uploadAssistantPatientDocument(data.patient.id, doc.file, doc.studyKind)
          } catch (err) {
            failures.push(
              err instanceof Error ? `${doc.file.name}: ${err.message}` : doc.file.name,
            )
          }
        }
        if (failures.length > 0) {
          throw new Error(
            failures.length === documents.length
              ? `Patient created but files could not be uploaded. ${failures[0]}`
              : `Patient created; ${failures.length} file(s) failed to upload. ${failures[0]}`,
          )
        }
      }

      return { ...data, uploadedDocumentsCount: documents.length }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assistant-patients"] })
      if (variables.draftIdToClear) {
        deleteAddPatientDraft(variables.draftIdToClear)
      }
      setActiveDraftId(null)
      refreshDrafts()
      setValues(defaultValues)
      setFieldErrors({})
      setPendingDocuments([])
      setPendingAvatarFile(null)
      setDocumentStudyKind("xray")
    },
  })

  const updateField = <T extends keyof AddPatientFormValues>(field: T, value: AddPatientFormValues[T]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // Medication helpers
  const addMedication = () => {
    const newMed: MedicationItem = {
      id: crypto.randomUUID(),
      name: "",
      dose: "",
      frequency: "",
      type: "",
      compliance: "",
      sideEffects: "",
    }
    setValues((prev) => ({
      ...prev,
      medications: [...prev.medications, newMed],
    }))
    setFieldErrors((prev) => ({ ...prev, medications: undefined }))
  }

  const updateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    setValues((prev) => ({
      ...prev,
      medications: prev.medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med
      ),
    }))
    setFieldErrors((prev) => ({ ...prev, medications: undefined }))
  }

  const removeMedication = (id: string) => {
    setValues((prev) => ({
      ...prev,
      medications: prev.medications.filter((med) => med.id !== id),
    }))
    setFieldErrors((prev) => ({ ...prev, medications: undefined }))
  }

  // Allergy helpers
  const addAllergy = () => {
    const newAllergy: AllergyItem = {
      id: crypto.randomUUID(),
      category: "",
      allergen: "",
      reaction: "",
    }
    setValues((prev) => ({
      ...prev,
      allergies: [...prev.allergies, newAllergy],
    }))
    setFieldErrors((prev) => ({ ...prev, allergies: undefined }))
  }

  const updateAllergy = (id: string, field: keyof AllergyItem, value: string) => {
    setValues((prev) => ({
      ...prev,
      allergies: prev.allergies.map((allergy) =>
        allergy.id === id ? { ...allergy, [field]: value } : allergy
      ),
    }))
    setFieldErrors((prev) => ({ ...prev, allergies: undefined }))
  }

  const removeAllergy = (id: string) => {
    setValues((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((allergy) => allergy.id !== id),
    }))
    setFieldErrors((prev) => ({ ...prev, allergies: undefined }))
  }

  const setAvatarFile = (file: File | null) => {
    setPendingAvatarFile(file)
    if (file) {
      setValues((prev) => ({ ...prev, avatarUrl: "" }))
    }
  }

  const setAvatarPreset = (url: string) => {
    setPendingAvatarFile(null)
    updateField("avatarUrl", url)
  }

  const clearAvatar = () => {
    setPendingAvatarFile(null)
    updateField("avatarUrl", "")
  }

  const addPendingFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const next: PendingPatientDocument[] = []
    for (let i = 0; i < fileList.length; i += 1) {
      const file = fileList.item(i)
      if (file) {
        next.push({
          id: crypto.randomUUID(),
          file,
          studyKind: documentStudyKind,
        })
      }
    }
    setPendingDocuments((prev) => [...prev, ...next])
  }

  const removePendingDocument = (id: string) => {
    setPendingDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  const reset = () => {
    setValues(defaultValues)
    setFieldErrors({})
    setPendingDocuments([])
    setPendingAvatarFile(null)
    setDocumentStudyKind("xray")
    setActiveDraftId(null)
    createMutation.reset()
  }

  const saveDraft = () => {
    if (isAddPatientDraftEmpty(values)) {
      return { ok: false as const, reason: "empty" as const }
    }

    const saved = saveAddPatientDraft(
      { values, documentStudyKind },
      activeDraftId,
    )
    setActiveDraftId(saved.id)
    refreshDrafts()
    return { ok: true as const, draft: saved }
  }

  const restoreDraft = (draftId: string) => {
    const draft = getAddPatientDraft(draftId)
    if (!draft) {
      refreshDrafts()
      return { ok: false as const, reason: "missing" as const }
    }

    setValues(draft.snapshot.values)
    setFieldErrors({})
    setPendingDocuments([])
    setPendingAvatarFile(null)
    setDocumentStudyKind(draft.snapshot.documentStudyKind)
    setActiveDraftId(draft.id)
    createMutation.reset()
    return { ok: true as const, draft }
  }

  const removeDraft = (draftId: string) => {
    deleteAddPatientDraft(draftId)
    if (activeDraftId === draftId) {
      setActiveDraftId(null)
    }
    refreshDrafts()
  }

  const submit = () => {
    const result = addPatientSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues))
      return
    }
    createMutation.mutate({
      formValues: result.data,
      documents: pendingDocuments,
      avatarFile: pendingAvatarFile,
      draftIdToClear: activeDraftId,
    })
  }

  const serverErrorMessage =
    createMutation.isError && isAxiosError(createMutation.error)
      ? (createMutation.error.response?.data as { message?: string } | undefined)?.message ??
        createMutation.error.message
      : createMutation.isError
        ? "Something went wrong. Try again."
        : null

  return {
    values,
    fieldErrors,
    patients: patientsFromDb ?? [],
    isLoadingPatients,
    isSubmitting: createMutation.isPending,
    isSuccess: createMutation.isSuccess,
    submitError: serverErrorMessage,
    createResult: createMutation.data,
    pendingDocuments,
    pendingAvatarFile,
    documentStudyKind,
    setDocumentStudyKind,
    setAvatarFile,
    setAvatarPreset,
    clearAvatar,
    addPendingFiles,
    removePendingDocument,
    updateField,
    addMedication,
    updateMedication,
    removeMedication,
    addAllergy,
    updateAllergy,
    removeAllergy,
    reset,
    saveDraft,
    restoreDraft,
    removeDraft,
    drafts,
    activeDraftId,
    submit,
  }
}
