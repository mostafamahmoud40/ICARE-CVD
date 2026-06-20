import { tool } from 'langchain';
import { z } from 'zod';

import type { PatientAppointmentToolsService } from './patient-appointment-tools.service';

export function buildPatientAppointmentLangChainTools(
  toolsService: PatientAppointmentToolsService,
  userId: number,
) {
  const bookAppointment = tool(
    async ({ doctorId, scheduledAt, visitType, reason }) => {
      const result = await toolsService.execute(
        'book_appointment',
        { doctorId, scheduledAt, visitType, reason },
        userId,
      );
      return JSON.stringify(result.data);
    },
    {
      name: 'book_appointment',
      description:
        'Book a NEW appointment. Use scheduledAt from CLINIC SCHEDULE context (after →). Only when patient explicitly wants to book.',
      schema: z.object({
        doctorId: z.string().describe('Doctor UUID from context'),
        scheduledAt: z
          .string()
          .describe('ISO datetime from context, e.g. 2026-06-13T14:40:00+03:00'),
        visitType: z.enum(['clinic', 'virtual']),
        reason: z.string().describe('Default: Cardiology follow-up'),
      }),
    },
  );

  const cancelAppointment = tool(
    async ({ confirmationCode }) => {
      const result = await toolsService.execute(
        'cancel_appointment',
        { confirmationCode },
        userId,
      );
      return JSON.stringify(result.data);
    },
    {
      name: 'cancel_appointment',
      description:
        'Cancel ONE upcoming appointment by its confirmation code from MY UPCOMING APPOINTMENTS.',
      schema: z.object({
        confirmationCode: z.string().describe('e.g. ICV-3603'),
      }),
    },
  );

  const cancelAllAppointments = tool(
    async () => {
      const result = await toolsService.execute(
        'cancel_all_appointments',
        {},
        userId,
      );
      return JSON.stringify(result.data);
    },
    {
      name: 'cancel_all_appointments',
      description:
        'Cancel ALL upcoming appointments. Use ONLY after explicit patient confirmation (أيوه / نعم / أكد / yes).',
      schema: z.object({}),
    },
  );

  const rescheduleAppointment = tool(
    async ({ confirmationCode, scheduledAt }) => {
      const result = await toolsService.execute(
        'reschedule_appointment',
        { confirmationCode, scheduledAt },
        userId,
      );
      return JSON.stringify(result.data);
    },
    {
      name: 'reschedule_appointment',
      description:
        'Move an existing appointment to a new slot. Use confirmationCode + new scheduledAt from CLINIC SCHEDULE context.',
      schema: z.object({
        confirmationCode: z.string().describe('e.g. ICV-3603'),
        scheduledAt: z
          .string()
          .describe('New ISO datetime from clinic schedule context'),
      }),
    },
  );

  const changeVisitType = tool(
    async ({ confirmationCode, visitType }) => {
      const result = await toolsService.execute(
        'change_visit_type',
        { confirmationCode, visitType },
        userId,
      );
      return JSON.stringify(result.data);
    },
    {
      name: 'change_visit_type',
      description:
        'Change visit type (clinic ↔ virtual) for an existing upcoming appointment.',
      schema: z.object({
        confirmationCode: z.string(),
        visitType: z.enum(['clinic', 'virtual']),
      }),
    },
  );

  return [
    bookAppointment,
    cancelAppointment,
    cancelAllAppointments,
    rescheduleAppointment,
    changeVisitType,
  ];
}
