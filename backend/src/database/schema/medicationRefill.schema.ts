import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { medication } from './medication.schema';

/** Tracks remaining refills per medication prescription. */
export const medicationRefill = pgTable('medication_refill', {
  id: uuid('id').defaultRandom().primaryKey(),
  medicationId: uuid('medication_id')
    .references(() => medication.id, { onDelete: 'cascade' })
    .notNull(),
  remainingRefills: integer('remaining_refills').notNull().default(0),
  lastRefilledAt: timestamp('last_refilled_at', { withTimezone: true }),
  nextRefillDue: timestamp('next_refill_due', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
