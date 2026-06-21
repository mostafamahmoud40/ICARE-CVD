import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { medication } from './medication.schema';
import { user } from './users.schema';

export const medicationAdherenceFlag = pgTable('medication_adherence_flag', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  medicationId: uuid('medication_id').references(() => medication.id, {
    onDelete: 'set null',
  }),
  reason: text('reason').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  resolutionNote: text('resolution_note'),
  createdByUserId: integer('created_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const medicationEscalation = pgTable('medication_escalation', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  medicationId: uuid('medication_id').references(() => medication.id, {
    onDelete: 'set null',
  }),
  priority: varchar('priority', { length: 20 }).notNull(),
  reason: text('reason').notNull(),
  note: text('note').notNull().default(''),
  status: varchar('status', { length: 30 }).notNull().default('waiting_review'),
  createdByUserId: integer('created_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const medicationContactLog = pgTable('medication_contact_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  summary: text('summary').notNull(),
  messagePreview: text('message_preview').notNull().default(''),
  createdByUserId: integer('created_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const medicationAiInsightDismissal = pgTable(
  'medication_ai_insight_dismissal',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .references(() => patient.id, { onDelete: 'cascade' })
      .notNull(),
    insightKey: varchar('insight_key', { length: 120 }).notNull(),
    dismissedByUserId: integer('dismissed_by_user_id').references(
      () => user.id,
      { onDelete: 'set null' },
    ),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('medication_ai_insight_dismissal_unique').on(
      table.patientId,
      table.insightKey,
    ),
  ],
);
