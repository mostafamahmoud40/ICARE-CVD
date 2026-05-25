"use client"

import { useState } from "react"
import type { AppointmentsPageData } from "./appointments.types"
import { Skeleton } from "@/components/ui/skeleton"
import { DoctorCard } from "./DoctorCard"
import { VisitTypeSelector } from "./VisitTypeSelector"
import { DateTimePicker } from "./DateTimePicker"
import { BookingSummary } from "./BookingSummary"
import { BookingReason } from "./BookingReason"
import { FileUpload } from "./FileUpload"
import { MyAppointments } from "./MyAppointments"
import { useBookingForm } from "./useBookingForm"
import { useAppointments } from "./useAppointments"
import { SparklesIcon } from "lucide-react"
import { appointmentsScrollbarCss } from "./shared"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      {/* My Appointments Skeleton */}
      <Skeleton className="h-[300px] w-full rounded-2xl" />
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
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

function BookingSection({
  data,
  onBack,
  onCreateAppointment,
}: {
  data: AppointmentsPageData
  onBack: () => void
  onCreateAppointment: (payload: {
    doctorId: string
    scheduledAt: string
    visitType: "clinic" | "virtual"
    reason: string
  }) => Promise<unknown>
}) {
  const {
    visitType,
    selectedDate,
    selectedSlot,
    reason,
    files,
    setVisitType,
    setSelectedDate,
    setSelectedSlot,
    setReason,
    setFiles,
    handleConfirm,
  } = useBookingForm({
    selectedDate: data.days.find((d) => !d.disabled)?.fullDate ?? "",
    selectedSlot:
      data.timeSlotsByDate[data.days.find((d) => !d.disabled)?.fullDate ?? ""]?.find((s) => s.available)?.time ??
      "",
    onConfirm: async (state) => {
      if (!data.selectedDoctor) {
        alert("No doctors are available right now.")
        return
      }
      if (!state.selectedDate || !state.selectedSlot) {
        alert("Please select date and time.")
        return
      }
      const normalizedReason = state.reason.trim()
      if (!normalizedReason) {
        alert("Reason for visit is required.")
        return
      }
      try {
        const scheduledAt = combineDateAndTime(state.selectedDate, state.selectedSlot)
        await onCreateAppointment({
          doctorId: data.selectedDoctor.id,
          scheduledAt,
          visitType: state.visitType,
          reason: normalizedReason,
        })
        alert("Appointment confirmed.")
        onBack()
      } catch {
        alert("This slot is already booked. Please choose another time.")
      }
    },
  })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F9F8F5] animate-in fade-in duration-500">
      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="mb-2 flex items-center gap-2 sm:mb-2.5">
            <Breadcrumb>
              <BreadcrumbList className="text-[10px] sm:text-[11px]">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      type="button"
                      onClick={onBack}
                      className="cursor-pointer text-[10px] font-medium sm:text-[11px]"
                    >
                      My appointments
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-[10px] font-medium sm:text-[11px]">
                    Book appointment
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-0.5">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[24px] lg:text-[26px]">
                Book appointment
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                Choose visit type, reason, and a time slot with lower wait probability for your check-up.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/80 px-3 py-2 text-violet-700">
              <SparklesIcon className="size-4 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold sm:text-[12px]">AI-suggested slots</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#F9F8F5] px-6 sm:px-8">
        <div className="custom-scrollbar w-full pb-8 pt-4">
          <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:gap-8">
        <div className="space-y-5 sm:space-y-6">
          {data.selectedDoctor ? (
            <DoctorCard
              name={data.selectedDoctor.name}
              title={data.selectedDoctor.title}
              experience={data.selectedDoctor.experience}
              specialties={data.selectedDoctor.specialties}
              avatarSeed={data.selectedDoctor.id}
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No doctors available currently. Please try again later.
            </div>
          )}
          <VisitTypeSelector selected={visitType} onChange={setVisitType} />
          <BookingReason value={reason} onChange={setReason} />
          <FileUpload files={files} onFilesChange={setFiles} />
          <DateTimePicker
            days={data.days}
            timeSlots={data.timeSlotsByDate[selectedDate] ?? []}
            monthLabel={data.monthLabel}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={setSelectedDate}
            onSlotChange={setSelectedSlot}
            aiTipTitle={data.aiTipTitle}
            aiTipBody={data.aiTipBody}
          />
        </div>

        <BookingSummary
          doctorName={data.selectedDoctor?.name ?? "Doctor unavailable"}
          selectedDate={selectedDate}
          selectedSlot={selectedSlot}
          fees={data.fees}
          onConfirm={handleConfirm}
        />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: appointmentsScrollbarCss() }} />
    </div>
  )
}

function AppointmentsContent({
  data,
  onCreateAppointment,
  onCancelAppointment,
}: {
  data: AppointmentsPageData
  onCreateAppointment: (payload: {
    doctorId: string
    scheduledAt: string
    visitType: "clinic" | "virtual"
    reason: string
  }) => Promise<unknown>
  onCancelAppointment: (appointmentId: string) => Promise<unknown>
}) {
  const [showBooking, setShowBooking] = useState(false)

  if (showBooking) {
    return (
      <BookingSection
        data={data}
        onBack={() => setShowBooking(false)}
        onCreateAppointment={onCreateAppointment}
      />
    )
  }

  return (
    <MyAppointments
      appointments={data.appointments}
      upcoming={data.upcoming}
      past={data.past}
      onBookNew={() => setShowBooking(true)}
      onCancelAppointment={onCancelAppointment}
    />
  )
}

function combineDateAndTime(dateOnly: string, slotLabel: string) {
  const [time, period] = slotLabel.split(" ")
  const [hhRaw, mmRaw] = time.split(":").map(Number)
  const hours24 = period === "PM" ? (hhRaw % 12) + 12 : hhRaw % 12
  const d = new Date(`${dateOnly}T00:00:00`)
  d.setHours(hours24, mmRaw, 0, 0)
  return d.toISOString()
}

export function Appointments() {
  const { data, isLoading, createAppointment, cancelAppointment } = useAppointments()
  return (
    <main className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F9F8F5]">
      {isLoading ? (
        <div className="p-4 md:p-6">
          <LoadingSkeleton />
        </div>
      ) : null}
      {data ? (
        <AppointmentsContent
          data={data}
          onCreateAppointment={createAppointment}
          onCancelAppointment={cancelAppointment}
        />
      ) : null}
    </main>
  )
}
