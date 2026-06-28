import { z } from "zod"

const doctorAssistantBaseSchema = z.object({
  fullName: z.string().trim().min(3, "Full name must be at least 3 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+0-9][0-9 -]{7,15}$/, "Enter a valid phone number."),
  department: z.string().trim(),
  experienceYears: z
    .number()
    .int()
    .min(0, "Experience must be at least 0 years.")
    .max(60, "Experience must be at most 60 years."),
  avatarUrl: z.string().trim(),
})

export const createDoctorAssistantSchema = doctorAssistantBaseSchema

export const updateDoctorAssistantSchema = doctorAssistantBaseSchema
