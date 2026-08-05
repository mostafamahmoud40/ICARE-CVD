import { z } from "zod"
import type { DoctorProfile } from "./doctorAccount.types"

export const doctorProfileEditSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(6, "Phone is required"),
  specialty: z.string().trim().min(2, "Specialty is required"),
  title: z.string().trim().min(2, "Title is required"),
  experienceYears: z.coerce.number().int().min(0).max(60),
  clinicName: z.string().trim().min(2, "Clinic name is required"),
  clinicLocation: z.string().trim().min(2, "Location is required"),
  about: z.string().trim().max(600, "Bio is too long"),
  avatarUrl: z.string().trim().optional(),
  clinicConsultationFee: z.coerce
    .number()
    .int("Enter a whole number")
    .min(0, "Fee cannot be negative")
    .max(100_000, "Fee is too high"),
  onlineConsultationFee: z.coerce
    .number()
    .int("Enter a whole number")
    .min(0, "Fee cannot be negative")
    .max(100_000, "Fee is too high"),
})

export type DoctorProfileEditValues = z.infer<typeof doctorProfileEditSchema>

export function profileToEditValues(
  profile: Pick<
    DoctorProfile,
    | "fullName"
    | "email"
    | "phone"
    | "specialty"
    | "title"
    | "experienceYears"
    | "clinicName"
    | "clinicLocation"
    | "about"
    | "avatarUrl"
    | "clinicConsultationFee"
    | "onlineConsultationFee"
  >,
): DoctorProfileEditValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    specialty: profile.specialty,
    title: profile.title,
    experienceYears: profile.experienceYears,
    clinicName: profile.clinicName,
    clinicLocation: profile.clinicLocation,
    about: profile.about,
    avatarUrl: profile.avatarUrl?.trim() || undefined,
    clinicConsultationFee: profile.clinicConsultationFee,
    onlineConsultationFee: profile.onlineConsultationFee,
  }
}
