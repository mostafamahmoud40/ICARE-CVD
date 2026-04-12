import { z } from "zod"

import { WEEKDAY_ORDER } from "./doctorSchedule.types"

const timeHm = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm")

export function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number)
  return h * 60 + m
}

const weekdayEnum = z.enum(WEEKDAY_ORDER)

const timeBlockSchema = z
  .object({
    id: z.string().min(1),
    startTime: timeHm,
    endTime: timeHm,
  })
  .superRefine((block, ctx) => {
    if (timeToMinutes(block.startTime) >= timeToMinutes(block.endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End must be after start.",
        path: ["endTime"],
      })
    }
  })

export const dayAvailabilitySchema = z
  .object({
    weekday: weekdayEnum,
    label: z.string().min(1),
    enabled: z.boolean(),
    periods: z.array(timeBlockSchema),
    unavailableBlocks: z.array(timeBlockSchema),
    maxAppointmentsPerDay: z.union([
      z.null(),
      z.number().int().min(1, "Minimum 1").max(200, "Maximum 200"),
    ]),
  })
  .superRefine((day, ctx) => {
    if (!day.enabled) return

    if (day.periods.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one working period.",
        path: ["periods"],
      })
      return
    }

    const sorted = [...day.periods].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )
    for (let i = 1; i < sorted.length; i++) {
      if (
        timeToMinutes(sorted[i].startTime) < timeToMinutes(sorted[i - 1].endTime)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Working periods cannot overlap.",
          path: ["periods"],
        })
        break
      }
    }
  })

export const doctorScheduleSchema = z.object({
  days: z.array(dayAvailabilitySchema).length(7),
  slotDurationMinutes: z
    .number()
    .int()
    .min(10, "Minimum 10 minutes")
    .max(120, "Maximum 120 minutes"),
  bufferBetweenSlotsMinutes: z
    .number()
    .int()
    .min(0, "Minimum 0 minutes")
    .max(30, "Maximum 30 minutes")
    .default(10),
})

export type DoctorScheduleFormValues = z.infer<typeof doctorScheduleSchema>
