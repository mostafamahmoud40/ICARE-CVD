import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';
import { medication } from './medication.schema';

/** Tracks every medication take/skip event for adherence calculation. */
export const doseLog = pgTable('dose_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  medicationId: uuid('medication_id')
    .references(() => medication.id, { onDelete: 'cascade' })
    .notNull(),
  patientId: integer('patient_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }).defaultNow().notNull(),
  skipped: boolean('skipped').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
