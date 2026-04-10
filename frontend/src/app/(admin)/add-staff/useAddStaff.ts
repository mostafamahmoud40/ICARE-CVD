"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import type { ZodIssue } from "zod"

import { apiClient } from "@/lib/api-client"

import { addStaffSchema } from "./addStaff.schema"
import type {
  AddStaffApiResponse,
  AddStaffFieldErrors,
  AddStaffFormValues,
  CreatedStaffMember,
} from "./addStaff.types"

const defaultValues: AddStaffFormValues = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  role: "doctor",
  specialty: "",
  experienceYears: "",
}

function toFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<AddStaffFieldErrors>((acc, issue) => {
    const field = issue.path[0]
    if (typeof field === "string") {
      acc[field as keyof AddStaffFormValues] = issue.message
    }
    return acc
  }, {})
}

export function useAddStaff() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<AddStaffFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<AddStaffFieldErrors>({})
  const [createdMembers, setCreatedMembers] = useState<CreatedStaffMember[]>([])
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)

  // ✅ Fetch staff from backend
  const { data: staffFromDb, isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data } = await apiClient.get<CreatedStaffMember[]>("/admin/staff")
      return data
    },
  })

  // Load staff from DB on mount
  useEffect(() => {
    if (staffFromDb && !isLoading) {
      setCreatedMembers(staffFromDb)
    }
  }, [staffFromDb, isLoading])

  const createMutation = useMutation({
    mutationFn: async (formValues: AddStaffFormValues) => {
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
        phoneNumber: formValues.phoneNumber,
        role: formValues.role,
        specialty: formValues.specialty || undefined,
        experienceYears: formValues.experienceYears === "" ? 0 : formValues.experienceYears,
      }
      const { data } = await apiClient.post<AddStaffApiResponse>("/admin/staff", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      setValues(defaultValues)
      setFieldErrors({})
      setEditingMemberId(null)
    },
  })

  // ✅ Update staff mutation
  const updateMutation = useMutation({
    mutationFn: async (formValues: AddStaffFormValues) => {
      if (!editingMemberId) return
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
        phoneNumber: formValues.phoneNumber,
        role: formValues.role,
        specialty: formValues.specialty || undefined,
        experienceYears: formValues.experienceYears === "" ? 0 : formValues.experienceYears,
      }
      await apiClient.patch(`/admin/staff/${editingMemberId}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      setValues(defaultValues)
      setFieldErrors({})
      setEditingMemberId(null)
    },
  })

  // ✅ Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/staff/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
    },
  })

  const updateField = <T extends keyof AddStaffFormValues>(field: T, value: AddStaffFormValues[T]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const submit = () => {
    const result = addStaffSchema.safeParse(values)
    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues))
      return
    }

    if (editingMemberId) {
      updateMutation.mutate(result.data)
    } else {
      createMutation.mutate(result.data)
    }
  }

  const deleteMember = (id: number) => {
    deleteMutation.mutate(id)
  }

  const editMember = (member: CreatedStaffMember) => {
    setValues({
      fullName: member.fullName,
      email: member.email,
      password: "",
      phoneNumber: member.phone ?? "",
      role: member.role,
      specialty: member.specialty ?? "",
      experienceYears: member.experienceYears,
    })
    setFieldErrors({})
    setEditingMemberId(member.id)
  }

  const activeMutation = editingMemberId ? updateMutation : createMutation
  const serverErrorMessage =
    activeMutation.isError && isAxiosError(activeMutation.error)
      ? (activeMutation.error.response?.data as { message?: string } | undefined)?.message ??
        activeMutation.error.message
      : activeMutation.isError
        ? "Something went wrong. Try again."
        : null

  return {
    values,
    fieldErrors,
    createdMembers,
    isSubmitting: activeMutation.isPending,
    isSuccess: activeMutation.isSuccess,
    submitError: serverErrorMessage,
    editingMemberId,
    updateField,
    submit,
    deleteMember,
    editMember,
  }
}
