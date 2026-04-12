"use client"

import { useState } from "react"
import type { VisitType } from "./appointments.types"

export type BookingFormState = {
  visitType: VisitType
  selectedDate: number
  selectedSlot: string
}

export type BookingFormActions = {
  setVisitType: (v: VisitType) => void
  setSelectedDate: (d: number) => void
  setSelectedSlot: (s: string) => void
  handleConfirm: () => void
}

export function useBookingForm(
  initialState: Partial<BookingFormState> & { onConfirm?: (state: BookingFormState) => void } = {},
) {
  const [visitType, setVisitType] = useState<VisitType>(initialState.visitType ?? "clinic")
  const [selectedDate, setSelectedDate] = useState(initialState.selectedDate ?? 10)
  const [selectedSlot, setSelectedSlot] = useState(initialState.selectedSlot ?? "09:30 AM")

  const state: BookingFormState = { visitType, selectedDate, selectedSlot }

  const handleConfirm = () => {
    initialState.onConfirm?.(state)
  }

  return {
    ...state,
    setVisitType,
    setSelectedDate,
    setSelectedSlot,
    handleConfirm,
  }
}
