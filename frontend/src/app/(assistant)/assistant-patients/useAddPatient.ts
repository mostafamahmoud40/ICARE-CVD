"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import type { ZodIssue } from "zod"

import { apiClient } from "@/lib/api-client"

import { addPatientSchema } from "./addPatient.schema"
import type {
  AddPatientApiResponse,
  AddPatientFieldErrors,
  AddPatientFormValues,
  AllergyItem,
  CreatedPatient,
  MedicationItem,
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

  const { data: patientsFromDb } = useQuery({
    queryKey: ["assistant-patients"],
    queryFn: async () => {
      const { data } = await apiClient.get<CreatedPatient[]>("/assistant/patients")
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (formValues: AddPatientFormValues) => {
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        dateOfBirth: formValues.dateOfBirth || undefined,
        gender: formValues.gender || undefined,
        nationalId: formValues.nationalId || undefined,
        bloodType: formValues.bloodType || undefined,
        address: formValues.address || undefined,
        heightCm: formValues.heightCm ? parseFloat(formValues.heightCm) : undefined,
        weightKg: formValues.weightKg ? parseFloat(formValues.weightKg) : undefined,
        smokingStatus: formValues.smokingStatus || undefined,
        alcoholConsumption: formValues.alcoholConsumption || undefined,
        exerciseFrequency: formValues.exerciseFrequency || undefined,
        stressLevel: formValues.stressLevel || undefined,
        chiefComplaint: formValues.chiefComplaint || undefined,
        otherChiefComplaint: formValues.otherChiefComplaint || undefined,
        medicalHistoryNotes: formValues.medicalHistoryNotes || undefined,
        medications: formValues.medications.length > 0 ? formValues.medications : undefined,
        allergies: formValues.allergies.length > 0 ? formValues.allergies : undefined,
      }
      const { data } = await apiClient.post<AddPatientApiResponse>("/assistant/patients", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant-patients"] })
      setValues(defaultValues)
      setFieldErrors({})
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

  const reset = () => {
    setValues(defaultValues)
    setFieldErrors({})
    createMutation.reset()
  }

  const submit = () => {
    const result = addPatientSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues))
      return
    }
    createMutation.mutate(result.data)
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
    isSubmitting: createMutation.isPending,
    isSuccess: createMutation.isSuccess,
    submitError: serverErrorMessage,
    updateField,
    addMedication,
    updateMedication,
    removeMedication,
    addAllergy,
    updateAllergy,
    removeAllergy,
    reset,
    submit,
  }
}
