import { jsonb, pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';
import { assistant } from './assistant.schema';
import { doctor } from './doctor.schema';

export type AssistantWeeklyShiftDayRow = {
  weekday: string;
  status: 'active' | 'half-day' | 'holiday';
  startTime: string | null;
  endTime: string | null;
  note?: string | null;
};

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
    weeklyShifts: jsonb('weekly_shifts')
      .$type<AssistantWeeklyShiftDayRow[]>()
      .notNull()
      .default([]),
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
