import { date, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';

/** One-off extra working window for a specific calendar date (does not change weekly schedule). */
export const scheduleDayExtra = pgTable('schedule_day_extra', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  reason: varchar('reason', { length: 200 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ScheduleDayExtraRow = typeof scheduleDayExtra.$inferSelect;
export type NewScheduleDayExtraRow = typeof scheduleDayExtra.$inferInsert;
