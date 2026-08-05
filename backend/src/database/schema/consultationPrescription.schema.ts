import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  text,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { medication } from './medication.schema';

export const consultationPrescription = pgTable(
  'consultation_prescription',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    consultationId: uuid('consultation_id')
      .references(() => consultation.id, { onDelete: 'cascade' })
      .notNull(),
    medicationId: uuid('medication_id')
      .references(() => medication.id, { onDelete: 'cascade' })
      .notNull(),
    isNew: boolean('is_new').notNull().default(true),
    duration: varchar('duration', { length: 50 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('consultation_prescription_unique').on(
      table.consultationId,
      table.medicationId,
    ),
  ],
);
