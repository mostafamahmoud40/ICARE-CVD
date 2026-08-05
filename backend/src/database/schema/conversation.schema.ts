import {
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { assistant } from './assistant.schema';
import { doctor } from './doctor.schema';
import { patient } from './patient.schema';

export const conversationTypeEnum = pgEnum('conversation_type_enum', [
  'doctor_patient',
  'assistant_doctor',
  'assistant_patient',
]);

export const conversation = pgTable(
  'conversations',
  {
    id: serial('id').primaryKey(),
    conversationType: conversationTypeEnum('conversation_type')
      .notNull()
      .default('doctor_patient'),
    assistantId: uuid('assistant_id').references(() => assistant.id, {
      onDelete: 'cascade',
    }),
    doctorId: uuid('doctor_id').references(() => doctor.id, {
      onDelete: 'cascade',
    }),
    patientId: uuid('patient_id').references(() => patient.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('conversations_doctor_patient_unique')
      .on(table.doctorId, table.patientId)
      .where(sql`${table.conversationType} = 'doctor_patient'`),
    uniqueIndex('conversations_assistant_doctor_unique')
      .on(table.assistantId, table.doctorId)
      .where(sql`${table.conversationType} = 'assistant_doctor'`),
    uniqueIndex('conversations_assistant_patient_unique')
      .on(table.assistantId, table.patientId)
      .where(sql`${table.conversationType} = 'assistant_patient'`),
  ],
);

export type ConversationRow = typeof conversation.$inferSelect;
export type NewConversationRow = typeof conversation.$inferInsert;
