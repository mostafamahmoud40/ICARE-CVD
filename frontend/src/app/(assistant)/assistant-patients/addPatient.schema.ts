import { z } from "zod"

const medicationItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  dose: z.string(),
  frequency: z.string(),
  type: z.string(),
  compliance: z.string(),
  sideEffects: z.string(),
})

const allergyItemSchema = z.object({
  id: z.string(),
  category: z.string(),
  allergen: z.string(),
  reaction: z.string(),
})

export const addPatientSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    email: z.string().trim().email("Enter a valid email address."),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^[+0-9][0-9 -]{7,15}$/, "Enter a valid phone number."),
    dateOfBirth: z.string().trim().min(1, "Date of birth is required."),
    gender: z.enum(["male", "female"], { message: "Gender is required." }),
    nationalId: z.string().trim().min(1, "National ID is required."),
    bloodType: z.string().trim(),
    address: z.string().trim(),
    heightCm: z.string().trim(),
    weightKg: z.string().trim(),
    smokingStatus: z.string().trim(),
    alcoholConsumption: z.string().trim(),
    exerciseFrequency: z.string().trim(),
    stressLevel: z.string().trim(),
    maritalStatus: z.string().trim(),
    occupation: z.string().trim(),
    caffeineIntake: z.string().trim(),
    recreationalDrugUse: z.string().trim(),
    exerciseDuration: z.string().trim(),
    exerciseType: z.string().trim(),
    physicalActivityLevel: z.string().trim(),
    dietaryHabits: z.string().trim(),
    chiefComplaint: z.string().trim(),
    otherChiefComplaint: z.string().trim(),
    medicalHistoryNotes: z.string().trim(),
    medications: z.array(medicationItemSchema).max(40),
    allergies: z.array(allergyItemSchema).max(50),
  })
  .superRefine((data, ctx) => {
    data.medications.forEach((med, index) => {
      const hasAny =
        med.name.trim() ||
        med.dose.trim() ||
        med.frequency.trim() ||
        med.type.trim()
      if (!hasAny) return
      if (!med.name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Medication name is required.",
          path: ["medications", index, "name"],
        })
      }
      if (!med.dose.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dose is required.",
          path: ["medications", index, "dose"],
        })
      }
      if (!med.frequency.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Frequency is required.",
          path: ["medications", index, "frequency"],
        })
      }
      if (!med.type.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Medication type is required.",
          path: ["medications", index, "type"],
        })
      }
    })

    data.allergies.forEach((a, index) => {
      const hasAny = a.category.trim() || a.allergen.trim() || a.reaction.trim()
      if (!hasAny) return
      if (!a.category.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allergy category is required.",
          path: ["allergies", index, "category"],
        })
      }
      if (!a.allergen.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allergen is required.",
          path: ["allergies", index, "allergen"],
        })
      }
    })
  })

export type AddPatientSchemaValues = z.infer<typeof addPatientSchema>
