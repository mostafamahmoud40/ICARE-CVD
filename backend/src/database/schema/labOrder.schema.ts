import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { doctor } from './doctor.schema';
import { appointment } from './appointment.schema';
import { user } from './users.schema';

export const labOrderPriorityEnum = pgEnum('lab_order_priority', [
  'routine',
  'urgent',
  'stat',
]);

export const labOrderStatusEnum = pgEnum('lab_order_status', [
  'draft',
  'ordered',
  'collected',
  'resulted',
  'cancelled',
]);

/** Lab order header (one order can contain many tests). */
export const labOrder = pgTable('lab_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  orderedByDoctorId: uuid('ordered_by_doctor_id').references(() => doctor.id, {
    onDelete: 'set null',
  }),
  appointmentId: uuid('appointment_id').references(() => appointment.id, {
    onDelete: 'set null',
  }),
  priority: labOrderPriorityEnum('priority').notNull().default('routine'),
  status: labOrderStatusEnum('status').notNull().default('ordered'),
  /** Free-text clinical reason/context provided by the clinician. */
  notes: text('notes'),
  /** Optional: external lab requisition/reference number. */
  externalRef: text('external_ref'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** Soft cancellation metadata (if status = cancelled). */
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelledByUserId: integer('cancelled_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
});

