import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';
import { patient } from './patient.schema';
import { user } from './users.schema';

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'active',
  'archived',
]);

export const doctorPatient = pgTable(
  'doctor_patient',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id')
      .references(() => doctor.id, { onDelete: 'cascade' })
      .notNull(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    assignedByUserId: integer('assigned_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    status: assignmentStatusEnum('status').notNull().default('active'),
    isPrimary: boolean('is_primary').notNull().default(false),
    notes: text('notes'),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('doctor_patient_unique').on(table.doctorId, table.patientId),
  ],
);
