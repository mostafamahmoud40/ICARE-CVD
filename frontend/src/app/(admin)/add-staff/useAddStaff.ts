"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import type { ZodIssue } from "zod"
import { toast } from "sonner"

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
  acceptedVisitModes: "both",
  avatarUrl: "",
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
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data } = await apiClient.get<CreatedStaffMember[]>("/admin/staff")
      return data
    },
  })

  const resetForm = () => {
    setValues(defaultValues)
    setFieldErrors({})
    setEditingMemberId(null)
  }

  const createMutation = useMutation({
    mutationFn: async (formValues: AddStaffFormValues) => {
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password || undefined,
        phoneNumber: formValues.phoneNumber,
        role: formValues.role,
        specialty: formValues.specialty || undefined,
        acceptedVisitModes:
          formValues.role === "doctor" ? formValues.acceptedVisitModes : undefined,
        avatarUrl: formValues.avatarUrl,
      }
      const { data } = await apiClient.post<AddStaffApiResponse>("/admin/staff", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      resetForm()
      setDialogOpen(false)
      toast.success("Staff member created", {
        description: "The account has been added to the system.",
      })
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message ??
            error.message
          : "Something went wrong. Try again."
      toast.error("Could not create staff member", { description: message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (formValues: AddStaffFormValues) => {
      if (!editingMemberId) return
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        password: formValues.password || undefined,
        phoneNumber: formValues.phoneNumber,
        role: formValues.role,
        specialty: formValues.specialty || undefined,
        acceptedVisitModes:
          formValues.role === "doctor" ? formValues.acceptedVisitModes : undefined,
        avatarUrl: formValues.avatarUrl,
      }
      await apiClient.patch(`/admin/staff/${editingMemberId}`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      resetForm()
      setDialogOpen(false)
      toast.success("Staff member updated", {
        description: "Changes have been saved.",
      })
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message ??
            error.message
          : "Something went wrong. Try again."
      toast.error("Could not update staff member", { description: message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/staff/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      toast.success("Staff member removed")
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message ??
            error.message
          : "Something went wrong. Try again."
      toast.error("Could not delete staff member", { description: message })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiClient.patch(`/admin/staff/${id}/status`, { isActive })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] })
      toast.success(variables.isActive ? "Staff member activated" : "Staff member deactivated")
    },
    onError: (error) => {
      const message =
        isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message ??
            error.message
          : "Something went wrong. Try again."
      toast.error("Could not update staff status", { description: message })
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

  const toggleStatus = (id: number, isActive: boolean) => {
    toggleStatusMutation.mutate({ id, isActive })
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (member: CreatedStaffMember) => {
    setValues({
      fullName: member.fullName,
      email: member.email,
      password: "",
      phoneNumber: member.phone ?? "",
      role: member.role,
      specialty: member.specialty ?? "",
      experienceYears: member.experienceYears,
      acceptedVisitModes: member.acceptedVisitModes ?? "both",
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
    staff,
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
