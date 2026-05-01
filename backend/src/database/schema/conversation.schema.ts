import { pgTable, serial, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { doctor } from './doctor.schema';
import { patient } from './patient.schema';

export const conversation = pgTable(
  'conversations',
  {
    id: serial('id').primaryKey(),
    doctorId: uuid('doctor_id')
      .references(() => doctor.id, { onDelete: 'cascade' })
      .notNull(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('conversations_doctor_patient_unique').on(
      table.doctorId,
      table.patientId,
    ),
  ],
);

export type ConversationRow = typeof conversation.$inferSelect;
export type NewConversationRow = typeof conversation.$inferInsert;
