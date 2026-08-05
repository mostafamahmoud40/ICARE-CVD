import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';

export const chiefComplaintEnum = pgEnum('chief_complaint', [
  'chest-pain',
  'dyspnea',
  'palpitations',
  'syncope',
  'leg-swelling',
  'fatigue',
  'constitutional-infective',
  'peripheral-vascular',
  'hepatic-congestion',
  'jaundice',
  'cyanosis',
  'systemic-embolization',
  'neurological',
  'hypertension',
  'post-procedure',
  'post-discharge',
  'murmur',
  'abnormal-ecg',
  'other',
]);

export const patientHistory = pgTable('patient_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  chiefComplaint: chiefComplaintEnum('chief_complaint').notNull(),
  chiefComplaintOtherText: varchar('chief_complaint_other_text', {
    length: 255,
  }),
  hpiData: jsonb('hpi_data'),
  noCardiacHistory: boolean('no_cardiac_history').notNull().default(false),
  pastCardiacHistory: jsonb('past_cardiac_history'),
  noNonCardiacHistory: boolean('no_non_cardiac_history')
    .notNull()
    .default(false),
  pastNonCardiacHistory: jsonb('past_non_cardiac_history'),
  cardiovascularRiskFactors: jsonb('cardiovascular_risk_factors'),
  /** Free-text past diagnoses, surgeries, chronic conditions (assistant intake / notes). */
  medicalHistoryNotes: text('medical_history_notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
