import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { doctor } from './doctor.schema';

export const appointment = pgTable('appointment', {
  id: uuid('id').defaultRandom().primaryKey(),
  confirmationCode: varchar('confirmation_code', { length: 20 }).notNull().unique(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  visitType: text('visit_type').notNull(),
  status: text('status').notNull().default('scheduled'),
  reason: text('reason'),
  symptoms: text('symptoms'),
  notes: text('notes'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type AppointmentRow = typeof appointment.$inferSelect;
export type NewAppointmentRow = typeof appointment.$inferInsert;
