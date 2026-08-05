import { z } from "zod"

export const createDoctorAssistantSchema = z.object({
  fullName: z.string().trim().min(3, "Full name must be at least 3 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
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
  avatarUrl: z.string().min(1, "Please select an avatar."),
})

export const updateDoctorAssistantSchema = createDoctorAssistantSchema.extend({
  password: z
    .string()
    .max(128, "Password must be at most 128 characters.")
    .refine((value) => value === "" || value.length >= 8, {
      message: "Password must be at least 8 characters.",
    }),
})
