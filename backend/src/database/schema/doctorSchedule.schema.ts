import { integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';

export type TimeBlockRow = {
  id: string;
  startTime: string;
  endTime: string;
};

export type DayAvailabilityRow = {
  weekday: string;
  label: string;
  enabled: boolean;
  periods: TimeBlockRow[];
  unavailableBlocks: TimeBlockRow[];
  maxAppointmentsPerDay: number | null;
};

export const doctorSchedule = pgTable('doctor_schedule', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
  bufferBetweenSlotsMinutes: integer('buffer_between_slots_minutes')
    .notNull()
    .default(10),
  days: jsonb('days').$type<DayAvailabilityRow[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
