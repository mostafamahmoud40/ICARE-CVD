import { z } from "zod"

export const patientProfileEditSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(8, "Enter a valid phone number").max(30),
  address: z.string().trim().max(500),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed", ""]).optional(),
  occupation: z.string().trim().max(100),
  avatarUrl: z.string().trim().optional(),
})

export type PatientProfileEditValues = z.infer<typeof patientProfileEditSchema>

export function profileToEditValues(profile: {
  fullName: string
  email: string
  phone: string
  address: string
  maritalStatus: string | null
  occupation: string
  avatarUrl: string | null
}): PatientProfileEditValues {
  return {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    address: profile.address,
    maritalStatus: (profile.maritalStatus ?? "") as PatientProfileEditValues["maritalStatus"],
    occupation: profile.occupation,
    avatarUrl: profile.avatarUrl ?? undefined,
  }
}
