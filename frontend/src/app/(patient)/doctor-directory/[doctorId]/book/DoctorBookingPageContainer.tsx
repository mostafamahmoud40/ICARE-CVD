"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"

import { DoctorBooking } from "../../DoctorBooking"
import { useDoctorBooking } from "../../useDoctorBooking"

export function DoctorBookingPageContainer() {
  const params = useParams()
  const doctorId = typeof params.doctorId === "string" ? params.doctorId : ""
  const { data, isLoading, isError, createAppointment, isCreatingAppointment } =
    useDoctorBooking(doctorId)

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center bg-[#F4F3EF] px-6 text-center">
        <p className="text-[13px] font-medium text-muted-foreground">Loading doctor profile…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-full min-h-[50vh] flex-col items-center justify-center bg-[#F4F3EF] px-6 text-center">
        <p className="font-serif text-[20px] font-bold text-[#1A1F1E]">Doctor not found</p>
        <p className="mt-2 max-w-sm text-[13px] font-medium text-muted-foreground">
          This specialist may no longer be listed. Return to the directory to choose another doctor.
        </p>
        <Button
          asChild
          size="sm"
          className="mt-5 h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
        >
          <Link href="/doctor-directory">Doctor directory</Link>
        </Button>
      </div>
    )
  }

  return (
    <DoctorBooking
      data={data}
      onCreateAppointment={createAppointment}
      isCreating={isCreatingAppointment}
    />
  )
}
