import {
  date,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';

export const blockedDates = pgTable('blocked_dates', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  reason: varchar('reason', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type BlockedDateRow = typeof blockedDates.$inferSelect;
export type NewBlockedDateRow = typeof blockedDates.$inferInsert;
