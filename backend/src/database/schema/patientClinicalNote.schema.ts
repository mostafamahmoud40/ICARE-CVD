import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { user } from './users.schema';

export const patientClinicalNote = pgTable('patient_clinical_note', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  authorUserId: integer('author_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
