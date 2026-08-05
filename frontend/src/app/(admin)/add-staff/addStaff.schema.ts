import { z } from "zod"

export const addStaffSchema = z
  .object({
    fullName: z.string().trim().min(3, "Full name must be at least 3 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .max(128)
      .refine((val) => val === "" || val.length >= 8, {
        message: "Password must be at least 8 characters.",
      })
      .optional(),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+0-9][0-9 -]{7,15}$/, "Enter a valid phone number."),
    role: z.enum(["doctor", "assistant"]),
    specialty: z.string().trim(),
    experienceYears: z.number().int().min(0, "Experience must be at least 0 years.").max(60, "Experience must be at most 60 years."),
    acceptedVisitModes: z.enum(["clinic", "virtual", "both"]),
    avatarUrl: z.string().min(1, "Please select an avatar."),
  })
  .superRefine((value, ctx) => {
    if (value.role === "doctor" && value.specialty.length < 2) {
      ctx.addIssue({
        path: ["specialty"],
        code: z.ZodIssueCode.custom,
        message: "Specialty is required for doctors.",
      })
    }
  })

export type AddStaffSchemaValues = z.infer<typeof addStaffSchema>
