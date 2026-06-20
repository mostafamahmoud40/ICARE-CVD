import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { appointment } from './appointment.schema';
import { user } from './users.schema';

export const queueStatusEnum = pgEnum('queue_status', [
  'scheduled',
  'arrived',
  'waiting',
  'in-consultation',
  'report-pending',
  'completed',
  'no-show',
  'cancelled',
]);

export const queuePriorityEnum = pgEnum('queue_priority', [
  'normal',
  'urgent',
  'emergency',
]);

/**
 * Queue entries linked 1:1 to appointments.
 * The assistant manages queue-specific state (priority, room, status flow)
 * independently from the appointment schedule.
 */
export const patientQueue = pgTable('patient_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id')
    .references(() => appointment.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  addedByUserId: integer('added_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  status: queueStatusEnum('status').notNull().default('scheduled'),
  priority: queuePriorityEnum('priority').notNull().default('normal'),
  roomNumber: varchar('room_number', { length: 20 }),
  estimatedDurationMin: integer('estimated_duration_min'),
  notes: text('notes'),
  arrivedAt: timestamp('arrived_at', { withTimezone: true }),
  waitingSince: timestamp('waiting_since', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PatientQueueRow = typeof patientQueue.$inferSelect;
export type NewPatientQueueRow = typeof patientQueue.$inferInsert;
