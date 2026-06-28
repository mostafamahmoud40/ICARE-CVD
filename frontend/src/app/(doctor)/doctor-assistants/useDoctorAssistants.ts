"use client"

import { useEffect, useState } from "react"
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
  CreateDoctorAssistantResponse,
  DoctorAssistantFieldErrors,
  DoctorAssistantFormValues,
  DoctorAssistantMember,
} from "./doctorAssistants.types"
import { uploadDoctorAssistantAvatar } from "./doctorAssistants.upload"

const defaultValues: DoctorAssistantFormValues = {
  fullName: "",
  email: "",
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
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingAvatarFile) {
      setAvatarPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(pendingAvatarFile)
    setAvatarPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingAvatarFile])

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
    setPendingAvatarFile(null)
  }

  const createMutation = useMutation({
    mutationFn: async ({
      formValues,
      avatarFile,
    }: {
      formValues: DoctorAssistantFormValues
      avatarFile: File | null
    }) => {
      const presetAvatarUrl = avatarFile
        ? undefined
        : formValues.avatarUrl.trim() || undefined

      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        department: formValues.department || undefined,
        experienceYears:
          formValues.experienceYears === "" ? 0 : formValues.experienceYears,
        avatarUrl: presetAvatarUrl,
      }
      const { data } = await apiClient.post<CreateDoctorAssistantResponse>(
        "/doctor/assistants",
        payload,
      )

      if (avatarFile) {
        try {
          await uploadDoctorAssistantAvatar(data.id, avatarFile)
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? `Assistant added but profile photo could not be uploaded. ${err.message}`
              : "Assistant added but profile photo could not be uploaded.",
          )
        }
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-assistants"] })
      resetForm()
      setDialogOpen(false)
      if (data.credentialsEmailSent) {
        toast.success("Assistant added", {
          description: "Login credentials were sent to their email address.",
        })
      } else {
        toast.success("Assistant added", {
          description: "The assistant account was created successfully.",
        })
        toast.error("Login email not sent", {
          description:
            data.credentialsEmailError ??
            "Check BREVO_API_KEY and BREVO_FROM_EMAIL in backend/.env, then restart the API.",
        })
      }
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
    mutationFn: async ({
      formValues,
      avatarFile,
      memberId,
    }: {
      formValues: DoctorAssistantFormValues
      avatarFile: File | null
      memberId: number
    }) => {
      const payload = {
        fullName: formValues.fullName,
        email: formValues.email,
        phoneNumber: formValues.phoneNumber,
        department: formValues.department || undefined,
        experienceYears:
          formValues.experienceYears === "" ? 0 : formValues.experienceYears,
        ...(avatarFile ? {} : { avatarUrl: formValues.avatarUrl.trim() || undefined }),
      }
      await apiClient.patch(`/doctor/assistants/${memberId}`, payload)

      if (avatarFile) {
        try {
          await uploadDoctorAssistantAvatar(memberId, avatarFile)
        } catch (err) {
          throw new Error(
            err instanceof Error
              ? `Changes saved but profile photo could not be uploaded. ${err.message}`
              : "Changes saved but profile photo could not be uploaded.",
          )
        }
      }
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
      updateMutation.mutate({
        formValues: values,
        avatarFile: pendingAvatarFile,
        memberId: editingMemberId,
      })
    } else {
      createMutation.mutate({ formValues: values, avatarFile: pendingAvatarFile })
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
      phoneNumber: member.phone ?? "",
      department: member.department ?? "",
      experienceYears: member.experienceYears,
      avatarUrl: member.avatarUrl ?? "",
    })
    setFieldErrors({})
    setPendingAvatarFile(null)
    setEditingMemberId(member.id)
    setDialogOpen(true)
  }

  const cancelEdit = () => {
    resetForm()
    setDialogOpen(false)
  }

  const onAvatarFileSelect = (file: File | null) => {
    setPendingAvatarFile(file)
    if (file) {
      setValues((prev) => ({ ...prev, avatarUrl: "" }))
      setFieldErrors((prev) => ({ ...prev, avatarUrl: undefined }))
    }
  }

  const onAvatarPresetSelect = (url: string) => {
    setPendingAvatarFile(null)
    updateField("avatarUrl", url)
  }

  const onClearAvatar = () => {
    setPendingAvatarFile(null)
    updateField("avatarUrl", "")
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
    pendingAvatarFile,
    avatarPreviewUrl,
    onAvatarFileSelect,
    onAvatarPresetSelect,
    onClearAvatar,
    updateField,
    submit,
    deleteMember,
    toggleStatus,
    openCreate,
    openEdit,
    cancelEdit,
  }
}
