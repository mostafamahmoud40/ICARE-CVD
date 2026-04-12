"use client"

import type { AppointmentsPageData } from "./appointments.types"
import { Skeleton } from "@/components/ui/skeleton"
import { DoctorCard } from "./DoctorCard"
import { VisitTypeSelector } from "./VisitTypeSelector"
import { DateTimePicker } from "./DateTimePicker"
import { BookingSummary } from "./BookingSummary"
import { PastAppointmentsSection } from "./PastAppointmentsSection"
import { useBookingForm } from "./useBookingForm"
import { useAppointments } from "./useAppointments"
import { SparklesIcon } from "lucide-react"

function PageHeader() {
  return (
    <header>
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="size-3.5 text-[#00392D]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#00392D]">
          AI-Powered Scheduling
        </span>
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#1A1F1E]">
        Book Your Appointment
      </h1>
      <p className="m-0 max-w-xl text-[15px] leading-relaxed text-[#6B7870]">
        Our AI analyzes clinic traffic to suggest times with the lowest wait
        probability for your cardiovascular check-up.
      </p>
    </header>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-[160px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-500">
      {message}
    </div>
  )
}

function AppointmentsContent({ data }: { data: AppointmentsPageData }) {
  const {
    visitType,
    selectedDate,
    selectedSlot,
    setVisitType,
    setSelectedDate,
    setSelectedSlot,
    handleConfirm,
  } = useBookingForm({
    onConfirm: (state) => {
      console.log("Appointment confirmed:", state)
      alert("Appointment confirmed!")
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <DoctorCard
            name={data.doctor.name}
            title={data.doctor.title}
            experience={data.doctor.experience}
            rating={data.doctor.rating}
            specialties={data.doctor.specialties}
          />
          <VisitTypeSelector selected={visitType} onChange={setVisitType} />
          <DateTimePicker
            days={data.days}
            timeSlots={data.timeSlots}
            monthLabel={data.monthLabel}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={setSelectedDate}
            onSlotChange={setSelectedSlot}
            aiTipTitle={data.aiTipTitle}
            aiTipBody={data.aiTipBody}
          />
          <PastAppointmentsSection appointments={data.past} />
        </div>

        <BookingSummary
          doctorName={data.doctor.name}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          fees={data.fees}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  )
}

export function Appointments() {
  const { data, isLoading, isError, error } = useAppointments()
  return (
    <main className="w-full space-y-6 bg-[#F9F8F5] px-4 py-6 md:px-6">
      {isLoading ? <LoadingSkeleton /> : null}
      {isError ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : "Unable to load appointments."}
        />
      ) : null}
      {data ? <AppointmentsContent data={data} /> : null}
    </main>
  )
}
