import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';
import { patient } from './patient.schema';

export const documentCategoryEnum = pgEnum('document_category', [
  'lab_report',
  'imaging',
  'ecg',
  'prescription',
  'referral',
  'other',
]);

/**
 * Patient document table - stores document metadata for files uploaded to S3
 * SOLID: Single table for single responsibility (document metadata storage)
 */
export const patientDocument = pgTable('patient_document', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  patientId: uuid('patient_id').references(() => patient.id, {
    onDelete: 'cascade',
  }),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  contentType: varchar('content_type', { length: 100 }),
  sizeBytes: integer('size_bytes'),
  category: documentCategoryEnum('document_category'),
  title: varchar('title', { length: 255 }),
  uploadedByUserId: integer('uploaded_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/**
 * Patient document notes - stores shared notes for all documents
 * SOLID: Separate table for separate concern (shared notes management)
 */
export const patientDocumentNotes = pgTable('patient_document_notes', {
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .primaryKey(),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
