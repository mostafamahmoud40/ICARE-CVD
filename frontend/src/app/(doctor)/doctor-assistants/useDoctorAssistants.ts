"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import type { ZodIssue } from "zod"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"

import {
  createDoctorAssistantSchema,
  updateDoctorAssistantSchema,
} from "./doctorAssistants.schema"
import type {
  DoctorAssistantFieldErrors,
  DoctorAssistantFormValues,
  DoctorAssistantMember,
} from "./doctorAssistants.types"

const defaultValues: DoctorAssistantFormValues = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  department: "",
  experienceYears: "",
  avatarUrl: "",
}

function toFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<DoctorAssistantFieldErrors>((acc, issue) => {
    const field = issue.path[0]
    if (typeof field === "string") {
      acc[field as keyof DoctorAssistantFormValues] = issue.message
    }
    return acc
  }, {})
}

export function useDoctorAssistants() {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<DoctorAssistantFormValues>(defaultValues)
  const [fieldErrors, setFieldErrors] = useState<DoctorAssistantFieldErrors>({})
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: assistants = [], isLoading } = useQuery({
    queryKey: ["doctor-assistants"],
    queryFn: async () => {
      const { data } = await apiClient.get<DoctorAssistantMember[]>(
        "/doctor/assistants",
      )
      return data
    },
  })

  const resetForm = () => {
    setValues(defaultValues)
    setFieldErrors({})
    setEditingMemberId(null)
  }

  const createMutation = useMutation({
    mutationFn: async (formValues: DoctorAssistantFormValues) => {
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password,
        phoneNumber: formValues.phoneNumber,
        department: formValues.department || undefined,
        experienceYears:
          formValues.experienceYears === "" ? 0 : formValues.experienceYears,
        avatarUrl: formValues.avatarUrl,
      }
      const { data } = await apiClient.post<DoctorAssistantMember>(
        "/doctor/assistants",
        payload,
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-assistants"] })
      resetForm()
      setDialogOpen(false)
      toast.success("Assistant added", {
        description: "The assistant can now sign in with their credentials.",
      })
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            error.message)
          : "Something went wrong. Try again."
      toast.error("Could not add assistant", { description: message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (formValues: DoctorAssistantFormValues) => {
      if (!editingMemberId) return
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        department: formValues.department || undefined,
        experienceYears:
          formValues.experienceYears === "" ? 0 : formValues.experienceYears,
        avatarUrl: formValues.avatarUrl,
        ...(formValues.password.trim()
          ? { password: formValues.password }
          : {}),
      }
      await apiClient.patch(`/doctor/assistants/${editingMemberId}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-assistants"] })
      resetForm()
      setDialogOpen(false)
      toast.success("Assistant updated", {
        description: "Changes have been saved.",
      })
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            error.message)
          : "Something went wrong. Try again."
      toast.error("Could not update assistant", { description: message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/doctor/assistants/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-assistants"] })
      toast.success("Assistant removed from your team")
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            error.message)
          : "Something went wrong. Try again."
      toast.error("Could not remove assistant", { description: message })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiClient.patch(`/doctor/assistants/${id}/status`, { isActive })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-assistants"] })
      toast.success(variables.isActive ? "Assistant activated" : "Assistant deactivated")
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            error.message)
          : "Something went wrong. Try again."
      toast.error("Could not update assistant status", { description: message })
    },
  })

  const updateField = <T extends keyof DoctorAssistantFormValues>(
    field: T,
    value: DoctorAssistantFormValues[T],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const submit = () => {
    const parsed = {
      ...values,
      experienceYears:
        values.experienceYears === "" ? 0 : values.experienceYears,
    }

    const result = editingMemberId
      ? updateDoctorAssistantSchema.safeParse(parsed)
      : createDoctorAssistantSchema.safeParse(parsed)

    if (!result.success) {
      setFieldErrors(toFieldErrors(result.error.issues))
      return
    }

    if (editingMemberId) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const deleteMember = (id: number) => {
    deleteMutation.mutate(id)
  }

  const toggleStatus = (id: number, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive })
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (member: DoctorAssistantMember) => {
    setValues({
      fullName: member.fullName,
      email: member.email,
      password: "",
      phoneNumber: member.phone ?? "",
      department: member.department ?? "",
      experienceYears: member.experienceYears,
      avatarUrl: member.avatarUrl ?? "",
    })
    setFieldErrors({})
    setEditingMemberId(member.id)
    setDialogOpen(true)
  }

  const cancelEdit = () => {
    resetForm()
    setDialogOpen(false)
  }

  const activeMutation = editingMemberId ? updateMutation : createMutation

  return {
    assistants,
    isLoading,
    values,
    fieldErrors,
    isSubmitting: activeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    editingMemberId,
    dialogOpen,
    setDialogOpen,
    updateField,
    submit,
    deleteMember,
    toggleStatus,
    openCreate,
    openEdit,
    cancelEdit,
  }
}
