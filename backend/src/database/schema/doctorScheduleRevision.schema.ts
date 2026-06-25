import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';
import { user } from './users.schema';
import type { DayAvailabilityRow } from './doctorSchedule.schema';

export type ScheduleDayExtraSnapshot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
};

/** Full schedule snapshot stored on each save (for history / AI diff). */
export type DoctorScheduleSnapshot = {
  slotDurationMinutes: number;
  bufferBetweenSlotsMinutes: number;
  days: DayAvailabilityRow[];
  blockedDates: Array<{ id?: string; date: string; reason?: string | null }>;
  pausedPeriodIds: string[];
  doctorArrivalByWeekday: Record<string, string | null>;
  dayExtras: ScheduleDayExtraSnapshot[];
};

export const doctorScheduleRevision = pgTable('doctor_schedule_revision', {
  id: uuid('id').defaultRandom().primaryKey(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  /** Monotonic per doctor (1, 2, 3…) for easy "compare v3 vs v5". */
  revisionNumber: integer('revision_number').notNull(),
  snapshot: jsonb('snapshot').$type<DoctorScheduleSnapshot>().notNull(),
  changedByUserId: integer('changed_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  changedByRole: varchar('changed_by_role', { length: 32 }),
  changeSource: varchar('change_source', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type DoctorScheduleRevisionRow =
  typeof doctorScheduleRevision.$inferSelect;
