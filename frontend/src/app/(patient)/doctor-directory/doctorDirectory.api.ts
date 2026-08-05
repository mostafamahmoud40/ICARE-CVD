import type { DayOption, TimeSlot, VisitType } from "../appointments/appointments.types"
import type {
  Doctor,
  DoctorAvailability,
  DoctorVisitChannels,
  Specialty,
} from "./doctorDirectory.types"
import type { DoctorBookingPageData } from "./doctorBooking.types"

export type DoctorDirectoryApiRow = {
  id: string
  name: string
  title: string
  specialty: string
  experienceYears: number
  avatarUrl: string | null
  acceptedVisitModes: DoctorVisitChannels
  nextAvailableSlot: string | null
  availability: DoctorAvailability
  clinicConsultationFee?: number
  onlineConsultationFee?: number
  consultationFee?: number
}

export type DoctorAvailabilityApi = {
  monthLabel: string
  days: DayOption[]
  timeSlotsByDate: Record<string, TimeSlot[]>
}

const DEFAULT_CONSULTATION_FEE = 150

const SPECIALTY_META: Array<{
  match: RegExp
  icon: string
  color: string
  emoji?: string
}> = [
  { match: /cardio/i, icon: "HeartPulse", color: "#E15C5C", emoji: "🫀" },
  { match: /neuro/i, icon: "Brain", color: "#7C3AED" },
  { match: /pediatr/i, icon: "Baby", color: "#0891B2" },
  { match: /dermat/i, icon: "Stethoscope", color: "#1A5345" },
  { match: /orthop/i, icon: "Bone", color: "#D97706" },
  { match: /ophthal/i, icon: "Eye", color: "#0284C7" },
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function specialtyFromName(name: string): Specialty {
  const meta = SPECIALTY_META.find((entry) => entry.match.test(name))
  return {
    id: slugify(name) || "general",
    name,
    icon: meta?.icon ?? "Stethoscope",
    color: meta?.color ?? "#1A5345",
    emoji: meta?.emoji,
  }
}

export function mapDirectoryDoctor(row: DoctorDirectoryApiRow): Doctor {
  const specialty = specialtyFromName(row.specialty)
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    specialty,
    experience: row.experienceYears,
    rating: 0,
    reviewCount: 0,
    imageUrl: row.avatarUrl ?? undefined,
    about: "",
    availability: row.availability,
    visitChannels: row.acceptedVisitModes,
    nextAvailableSlot: row.nextAvailableSlot ?? "",
    fee: row.consultationFee ?? DEFAULT_CONSULTATION_FEE,
    location: "",
    hospital: "",
    languages: [],
  }
}

export function buildSpecialtiesFromDoctors(doctors: Doctor[]): Specialty[] {
  const byId = new Map<string, Specialty>()
  for (const doctor of doctors) {
    byId.set(doctor.specialty.id, doctor.specialty)
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function specialtyIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("cardio")) return "heart"
  if (lower.includes("neuro")) return "activity"
  return "calendar"
}

function visitChannelsToAllowedTypes(channels: DoctorVisitChannels): VisitType[] {
  if (channels === "clinic") return ["clinic"]
  if (channels === "virtual") return ["virtual"]
  return ["clinic", "virtual"]
}

export function buildDoctorBookingPageData(
  doctorRow: DoctorDirectoryApiRow,
  availability: DoctorAvailabilityApi,
): DoctorBookingPageData {
  const doctor = mapDirectoryDoctor(doctorRow)

  return {
    doctor,
    selectedDoctor: {
      id: doctor.id,
      name: doctor.name,
      title: doctor.title,
      experience: `${doctor.experience} years`,
      rating: doctor.rating,
      avatarUrl: doctor.imageUrl,
      specialties: [
        {
          icon: specialtyIcon(doctor.specialty.name),
          label: doctor.specialty.name,
          color: "primary",
        },
      ],
    },
    allowedVisitTypes: visitChannelsToAllowedTypes(doctor.visitChannels),
    days: availability.days,
    timeSlotsByDate: availability.timeSlotsByDate,
    fees: [
      { label: "Consultation fee", amount: `EGP ${doctor.fee.toLocaleString()}` },
      { label: "Platform fee", amount: "EGP 25" },
      {
        label: "Estimated total",
        amount: `EGP ${(doctor.fee + 25).toLocaleString()}`,
        highlight: true,
      },
    ],
    monthLabel: availability.monthLabel,
    aiTipTitle: "Why this slot?",
    aiTipBody:
      "Recommended slots are based on the doctor's schedule and typical wait times at this clinic.",
  }
}
