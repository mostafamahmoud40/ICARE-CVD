"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import { BookingReason } from "../appointments/BookingReason"
import { BookingSummary } from "../appointments/BookingSummary"
import { DateTimePicker } from "../appointments/DateTimePicker"
import { DoctorCard } from "../appointments/DoctorCard"
import { appointmentsScrollbarCss } from "../appointments/shared"
import { useBookingForm } from "../appointments/useBookingForm"
import { VisitTypeSelector } from "../appointments/VisitTypeSelector"
import { FileUpload } from "../appointments/FileUpload"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"

import type { DoctorBookingPageData } from "./doctorBooking.types"

type CreateAppointmentPayload = {
  doctorId: string
  scheduledAt: string
  visitType: "clinic" | "virtual"
  reason: string
}

type DoctorBookingProps = {
  data: DoctorBookingPageData
  onCreateAppointment: (payload: CreateAppointmentPayload) => Promise<unknown>
  isCreating?: boolean
}

function combineDateAndTime(dateOnly: string, slotLabel: string) {
  const [time, period] = slotLabel.split(" ")
  const [hhRaw, mmRaw] = time.split(":").map(Number)
  const hours24 = period === "PM" ? (hhRaw % 12) + 12 : hhRaw % 12
  const d = new Date(`${dateOnly}T00:00:00`)
  d.setHours(hours24, mmRaw, 0, 0)
  return d.toISOString()
}

export function DoctorBooking({ data, onCreateAppointment, isCreating }: DoctorBookingProps) {
  const router = useRouter()
  const defaultVisitType = data.allowedVisitTypes[0] ?? "clinic"
  const firstAvailableDay = data.days.find((d) => !d.disabled)?.fullDate ?? ""
  const firstAvailableSlot =
    data.timeSlotsByDate[firstAvailableDay]?.find((s) => s.available)?.time ?? ""

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
    visitType: defaultVisitType,
    selectedDate: firstAvailableDay,
    selectedSlot: firstAvailableSlot,
    onConfirm: async (state) => {
      if (!state.selectedDate || !state.selectedSlot) {
        toast.error("Select date and time", { description: "Pick an available slot to continue." })
        return
      }
      const normalizedReason = state.reason.trim()
      if (!normalizedReason) {
        toast.error("Reason required", { description: "Briefly describe why you need this visit." })
        return
      }
      if (!data.allowedVisitTypes.includes(state.visitType)) {
        toast.error("Visit type not available", {
          description: `${data.doctor.name} does not accept this visit type.`,
        })
        return
      }

      try {
        await onCreateAppointment({
          doctorId: data.doctor.id,
          scheduledAt: combineDateAndTime(state.selectedDate, state.selectedSlot),
          visitType: state.visitType,
          reason: normalizedReason,
        })
        toast.success("Appointment booked", {
          description: `Your visit with ${data.doctor.name} has been scheduled.`,
        })
        router.push("/appointments")
      } catch {
        toast.error("Booking failed", {
          description: "This slot may no longer be available. Please choose another time.",
        })
      }
    },
  })

  const doctorUnavailable = data.doctor.availability === "Unavailable"

  const visitTypeHint = useMemo(() => {
    if (data.doctor.visitChannels === "both") return "Clinic and online visits available"
    if (data.doctor.visitChannels === "virtual") return "Online visits only"
    return "In-clinic visits only"
  }, [data.doctor.visitChannels])

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[#F4F3EF] animate-in fade-in duration-500">
      <div className="shrink-0 border-b border-[#E8E6E0]/60 bg-white px-5 py-4 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList className="text-[11px]">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/doctor-directory" className="font-medium text-[#6B7870] hover:text-[#1A5345]">
                  Doctor directory
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-[#1A1F1E]">
                Book appointment
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="relative z-20 shrink-0 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex flex-col px-5 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-serif text-[22px] font-bold leading-tight tracking-tight text-[#1A1F1E] sm:text-[26px]">
                Book with {data.doctor.name}
              </h1>
              <p className="text-[13px] font-medium text-muted-foreground sm:text-[14px]">
                {visitTypeHint} · {data.doctor.specialty.name} · {data.doctor.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/80 px-3 py-2 text-violet-700">
                <SparklesIcon className="size-4 shrink-0" aria-hidden />
                <span className="text-[11px] font-bold sm:text-[12px]">AI-suggested slots</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 rounded-lg border-[#E8E6E0] bg-white px-3 text-[12px] font-bold text-[#1A5345] shadow-sm hover:bg-[#F9F8F5]"
              >
                <Link href="/doctor-directory">Back to directory</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto px-5 pb-10 sm:px-6 lg:px-8">
        <div className="custom-scrollbar w-full pt-5">
          {doctorUnavailable ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-8 text-center">
              <p className="font-serif text-[18px] font-bold text-[#1A1F1E]">
                {data.doctor.name} is not taking new bookings right now
              </p>
              <p className="mt-2 text-[13px] font-medium text-muted-foreground">
                Try another specialist or check back when availability opens.
              </p>
              <Button
                asChild
                size="sm"
                className="mt-4 h-8 rounded-lg bg-[#1A5345] px-4 text-[12px] font-bold text-white hover:bg-[#133F34]"
              >
                <Link href="/doctor-directory">Browse doctors</Link>
              </Button>
            </div>
          ) : (
            <div className="grid items-start gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:gap-8">
              <div className="space-y-5 sm:space-y-6">
                <DoctorCard
                  name={data.selectedDoctor.name}
                  title={data.selectedDoctor.title}
                  experience={data.selectedDoctor.experience}
                  specialties={data.selectedDoctor.specialties}
                  avatarUrl={data.selectedDoctor.avatarUrl}
                />
                <VisitTypeSelector
                  selected={visitType}
                  onChange={setVisitType}
                  allowedVisitTypes={data.allowedVisitTypes}
                />
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
                doctorName={data.selectedDoctor.name}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                fees={data.fees}
                onConfirm={handleConfirm}
                isSubmitting={isCreating}
              />
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: appointmentsScrollbarCss() }} />
    </div>
  )
}
