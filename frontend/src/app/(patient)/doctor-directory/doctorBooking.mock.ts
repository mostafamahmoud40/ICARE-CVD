import type { DayOption, TimeSlot, VisitType } from "../appointments/appointments.types"
import type { Doctor, DoctorVisitChannels } from "./doctorDirectory.types"
import { mockDoctors } from "./doctorDirectory.mock"
import type { DoctorBookingPageData } from "./doctorBooking.types"

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const DEFAULT_SLOTS: TimeSlot[] = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: true, recommended: true, label: "Low wait time" },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: false, label: "Booked" },
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true, recommended: true, label: "AI suggested" },
  { time: "03:00 PM", available: true },
]

function toDateOnly(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function buildUpcomingDays(count = 6): DayOption[] {
  const days: DayOption[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (days.length < count) {
    const dayOfWeek = cursor.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push({
        day: WEEKDAY_SHORT[dayOfWeek],
        date: cursor.getDate(),
        fullDate: toDateOnly(cursor),
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function buildTimeSlotsByDate(days: DayOption[]): Record<string, TimeSlot[]> {
  return Object.fromEntries(
    days.map((d, index) => [
      d.fullDate,
      DEFAULT_SLOTS.map((slot, slotIndex) => ({
        ...slot,
        available: slot.available && (index + slotIndex) % 5 !== 0,
      })),
    ]),
  )
}

function visitChannelsToAllowedTypes(channels: DoctorVisitChannels): VisitType[] {
  if (channels === "clinic") return ["clinic"]
  if (channels === "virtual") return ["virtual"]
  return ["clinic", "virtual"]
}

function specialtyIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("cardio")) return "heart"
  if (lower.includes("neuro")) return "activity"
  return "stethoscope"
}

export function getDoctorById(doctorId: string): Doctor | undefined {
  return mockDoctors.find((d) => d.id === doctorId)
}

export function buildDoctorBookingMock(doctorId: string): DoctorBookingPageData | null {
  const doctor = getDoctorById(doctorId)
  if (!doctor) return null

  const days = buildUpcomingDays()
  const firstMonth = days[0]
    ? new Date(`${days[0].fullDate}T12:00:00`)
    : new Date()

  return {
    doctor,
    selectedDoctor: {
      id: doctor.id,
      name: doctor.name,
      title: doctor.title,
      experience: `${doctor.experience} years`,
      rating: doctor.rating,
      specialties: [
        {
          icon: specialtyIcon(doctor.specialty.name),
          label: doctor.specialty.name,
          color: "primary",
        },
      ],
    },
    allowedVisitTypes: visitChannelsToAllowedTypes(doctor.visitChannels),
    days,
    timeSlotsByDate: buildTimeSlotsByDate(days),
    fees: [
      { label: "Consultation fee", amount: `EGP ${doctor.fee.toLocaleString()}` },
      { label: "Platform fee", amount: "EGP 25" },
      { label: "Estimated total", amount: `EGP ${(doctor.fee + 25).toLocaleString()}`, highlight: true },
    ],
    monthLabel: firstMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    aiTipTitle: "Why this slot?",
    aiTipBody: `${doctor.name} typically has shorter wait times mid-morning. Slots marked “AI suggested” match your past visit patterns.`,
  }
}
