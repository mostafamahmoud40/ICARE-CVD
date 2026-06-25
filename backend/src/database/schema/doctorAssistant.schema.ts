import { pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { assistant } from './assistant.schema';
import { doctor } from './doctor.schema';

/** Links assistants to the doctors who manage them. */
export const doctorAssistant = pgTable(
  'doctor_assistant',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    doctorId: uuid('doctor_id')
      .references(() => doctor.id, { onDelete: 'cascade' })
      .notNull(),
    assistantId: uuid('assistant_id')
      .references(() => assistant.id, { onDelete: 'cascade' })
      .notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('doctor_assistant_unique').on(
      table.doctorId,
      table.assistantId,
    ),
  ],
);
