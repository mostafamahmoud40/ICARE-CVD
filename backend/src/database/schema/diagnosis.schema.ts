import {
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { doctor } from './doctor.schema';

export const diagnosisTypeEnum = pgEnum('diagnosis_type', [
  'primary',
  'secondary',
  'differential',
]);

export const diagnosisSeverityEnum = pgEnum('diagnosis_severity', [
  'mild',
  'moderate',
  'severe',
  'critical',
]);

export const diagnosisConfirmationEnum = pgEnum('diagnosis_confirmation', [
  'confirmed',
  'unconfirmed',
  'presumed',
]);

export const diagnosisStatusEnum = pgEnum('diagnosis_status', [
  'active',
  'resolved',
  'chronic',
]);

export const lateralityTypeEnum = pgEnum('laterality_type', [
  'unspecified',
  'left',
  'right',
  'bilateral',
  'other',
]);

export const diagnosis = pgTable('diagnosis', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  icdCode: varchar('icd_code', { length: 20 }).notNull(),
  description: text('description').notNull(),
  type: diagnosisTypeEnum('type').notNull(),
  severity: diagnosisSeverityEnum('severity').notNull(),
  confirmation: diagnosisConfirmationEnum('confirmation').notNull(),
  onsetDate: date('onset_date'),
  status: diagnosisStatusEnum('status').notNull().default('active'),
  laterality: lateralityTypeEnum('laterality'),
  nyhaClass: varchar('nyha_class', { length: 5 }),
  clinicalNotes: text('clinical_notes'),
  diagnosedByDoctorId: uuid('diagnosed_by_doctor_id').references(
    () => doctor.id,
    { onDelete: 'set null' },
  ),
  diagnosedAt: timestamp('diagnosed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
