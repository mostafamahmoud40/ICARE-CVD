"use client"

import { useState } from "react"
import type { VisitType } from "./appointments.types"
import type { UploadedFile } from "./FileUpload"

export type BookingFormState = {
  visitType: VisitType
  selectedDate: string
  selectedSlot: string
  reason: string
  files: UploadedFile[]
}

export type BookingFormActions = {
  setVisitType: (v: VisitType) => void
  setSelectedDate: (d: string) => void
  setSelectedSlot: (s: string) => void
  setReason: (r: string) => void
  setFiles: (f: UploadedFile[]) => void
  handleConfirm: () => void
}

export function useBookingForm(
  initialState: Partial<BookingFormState> & { onConfirm?: (state: BookingFormState) => void } = {},
) {
  const [visitType, setVisitType] = useState<VisitType>(initialState.visitType ?? "clinic")
  const [selectedDate, setSelectedDate] = useState(initialState.selectedDate ?? "")
  const [selectedSlot, setSelectedSlot] = useState(initialState.selectedSlot ?? "09:30 AM")
  const [reason, setReason] = useState(initialState.reason ?? "")
  const [files, setFiles] = useState<UploadedFile[]>(initialState.files ?? [])

  const state: BookingFormState = { visitType, selectedDate, selectedSlot, reason, files }

  const handleConfirm = () => {
    initialState.onConfirm?.(state)
  }

  return {
    ...state,
    setVisitType,
    setSelectedDate,
    setSelectedSlot,
    setReason,
    setFiles,
    handleConfirm,
  }
}
