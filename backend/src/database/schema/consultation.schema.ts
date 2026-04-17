import {
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { doctor } from './doctor.schema';
import { appointment } from './appointment.schema';

export const consultationVisitTypeEnum = pgEnum('consultation_visit_type', [
  'follow-up',
  'new',
  'walk-in',
  'post-procedure',
  'urgent',
]);

export const consultationStatusEnum = pgEnum('consultation_status', [
  'in-progress',
  'completed',
  'cancelled',
]);

export const consultation = pgTable('consultation', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => appointment.id, {
    onDelete: 'set null',
  }),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  visitType: consultationVisitTypeEnum('visit_type').notNull(),
  chiefComplaint: text('chief_complaint'),
  historyOfPresentIllness: text('history_of_present_illness'),
  physicalExam: text('physical_exam'),
  plan: text('plan'),
  followUpTimeframe: varchar('follow_up_timeframe', { length: 100 }),
  followUpInstructions: text('follow_up_instructions'),
  notes: text('notes'),
  durationMinutes: smallint('duration_minutes'),
  status: consultationStatusEnum('status').notNull().default('in-progress'),
  startedAt: timestamp('started_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
