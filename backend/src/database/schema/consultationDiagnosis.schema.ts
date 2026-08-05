import {
  pgTable,
  timestamp,
  uuid,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { consultation } from './consultation.schema';
import { diagnosis } from './diagnosis.schema';
import { diagnosisTypeEnum } from './diagnosis.schema';

export const consultationDiagnosis = pgTable(
  'consultation_diagnosis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    consultationId: uuid('consultation_id')
      .references(() => consultation.id, { onDelete: 'cascade' })
      .notNull(),
    diagnosisId: uuid('diagnosis_id')
      .references(() => diagnosis.id, { onDelete: 'cascade' })
      .notNull(),
    type: diagnosisTypeEnum('type').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('consultation_diagnosis_unique').on(
      table.consultationId,
      table.diagnosisId,
    ),
  ],
);
