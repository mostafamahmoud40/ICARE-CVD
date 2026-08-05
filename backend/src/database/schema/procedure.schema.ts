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
import { consultation } from './consultation.schema';
import { doctor } from './doctor.schema';
import { patient } from './patient.schema';

export const procedureOrderStatusEnum = pgEnum('procedure_order_status', [
  'pending',
  'in-progress',
  'completed',
]);

export const procedurePriorityEnum = pgEnum('procedure_priority', [
  'normal',
  'urgent',
  'emergency',
]);

export const procedureRequirementKindEnum = pgEnum(
  'procedure_requirement_kind',
  ['standard', 'consent'],
);

export const procedureOrder = pgTable('procedure_order', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  doctorId: uuid('doctor_id')
    .references(() => doctor.id, { onDelete: 'cascade' })
    .notNull(),
  consultationId: uuid('consultation_id').references(() => consultation.id, {
    onDelete: 'set null',
  }),
  procedureName: text('procedure_name').notNull(),
  department: varchar('department', { length: 120 })
    .notNull()
    .default('Cardiology'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }),
  actualEndAt: timestamp('actual_end_at', { withTimezone: true }),
  status: procedureOrderStatusEnum('status').notNull().default('pending'),
  priority: procedurePriorityEnum('priority').notNull().default('normal'),
  location: varchar('location', { length: 120 }),
  teamStatus: varchar('team_status', { length: 120 }),
  durationMinutes: integer('duration_minutes'),
  riskScore: varchar('risk_score', { length: 120 }),
  riskTags: jsonb('risk_tags').$type<string[]>().notNull().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const procedureRequirement = pgTable('procedure_requirement', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => procedureOrder.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  kind: procedureRequirementKindEnum('kind').notNull().default('standard'),
  allowsAttachment: boolean('allows_attachment').notNull().default(false),
  dueAt: timestamp('due_at', { withTimezone: true }),
  isDone: boolean('is_done').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  attachmentKey: text('attachment_key'),
  attachmentName: varchar('attachment_name', { length: 255 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const procedureConsent = pgTable('procedure_consent', {
  orderId: uuid('order_id')
    .references(() => procedureOrder.id, { onDelete: 'cascade' })
    .primaryKey(),
  requirementId: uuid('requirement_id')
    .references(() => procedureRequirement.id, { onDelete: 'cascade' })
    .notNull(),
  signerType: varchar('signer_type', { length: 20 }).notNull(),
  signerName: varchar('signer_name', { length: 200 }).notNull(),
  guardianRelationship: varchar('guardian_relationship', { length: 120 }),
  collectionMethod: varchar('collection_method', { length: 20 }).notNull(),
  signatureDataUrl: text('signature_data_url'),
  attachmentKey: text('attachment_key'),
  attachmentName: varchar('attachment_name', { length: 255 }),
  signedAt: timestamp('signed_at', { withTimezone: true }).notNull(),
});
