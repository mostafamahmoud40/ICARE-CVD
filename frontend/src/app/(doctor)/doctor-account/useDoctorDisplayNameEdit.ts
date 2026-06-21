"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { showIcareErrorToast, showIcareSuccessToast } from "@/components/shared/icare-toast"
import { updateDoctorAccount } from "./doctorAccount.api"

const ACCOUNT_QUERY_KEY = ["doctor", "account"] as const

export function useDoctorDisplayNameEdit(displayName: string) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (fullName: string) => updateDoctorAccount({ fullName }),
    onSuccess: (data) => {
      queryClient.setQueryData(ACCOUNT_QUERY_KEY, data)
      showIcareSuccessToast("Name updated", "Your display name was saved.")
      setOpen(false)
    },
    onError: (error: Error) => {
      showIcareErrorToast("Could not save name", error.message)
    },
  })

  return {
    open,
    setOpen,
    saveName: (fullName: string) => mutation.mutateAsync(fullName),
    isSaving: mutation.isPending,
    displayName,
  }
}
