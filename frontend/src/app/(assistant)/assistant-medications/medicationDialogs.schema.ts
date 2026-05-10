import { z } from "zod";

export const flagMedicationSchema = z.object({
  reason: z.string().min(4, "Add a short reason").max(500),
  severity: z.enum(["info", "watch", "critical"]),
});

export type FlagMedicationFormValues = z.infer<typeof flagMedicationSchema>;

export const reminderSchema = z.object({
  channel: z.enum(["sms", "push"]),
  message: z.string().min(8, "Message is too short").max(2000),
  templateLabel: z.string().min(2).max(80).optional(),
});

export type ReminderFormValues = z.infer<typeof reminderSchema>;

export const editInstructionsSchema = z.object({
  dosageInstructions: z.string().min(6, "Instructions too short").max(800),
});

export type EditInstructionsFormValues = z.infer<typeof editInstructionsSchema>;

export const escalateMedicationSchema = z.object({
  medicationLineId: z.string().nullable(),
  priority: z.enum(["routine", "urgent", "critical"]),
  reason: z.string().min(8, "Add a short clinical reason").max(240),
  note: z.string().min(8, "Add a note for the doctor").max(800),
});

export type EscalateMedicationFormValues = z.infer<typeof escalateMedicationSchema>;
