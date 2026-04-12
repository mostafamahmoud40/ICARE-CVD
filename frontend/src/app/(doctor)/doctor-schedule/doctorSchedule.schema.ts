import { z } from "zod"

import { WEEKDAY_ORDER } from "./doctorSchedule.types"

const timeHm = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm")

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number)
  return h * 60 + m
}

const weekdayEnum = z.enum(WEEKDAY_ORDER)

export const dayAvailabilitySchema = z
  .object({
    weekday: weekdayEnum,
    label: z.string().min(1),
    enabled: z.boolean(),
    startTime: timeHm,
    endTime: timeHm,
  })
  .superRefine((day, ctx) => {
    if (!day.enabled) return
    const start = timeToMinutes(day.startTime)
    const end = timeToMinutes(day.endTime)
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time.",
        path: ["endTime"],
      })
    }
  })

export const doctorScheduleSchema = z.object({
  days: z.array(dayAvailabilitySchema).length(7),
  slotDurationMinutes: z
    .number()
    .int()
    .min(10, "Minimum 10 minutes")
    .max(120, "Maximum 120 minutes"),
})

export type DoctorScheduleFormValues = z.infer<typeof doctorScheduleSchema>
