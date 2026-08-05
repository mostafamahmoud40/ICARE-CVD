import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { labOrderItem } from './labOrderItem.schema';
import { patientDocument } from './document.schema';

export const labResultStatusEnum = pgEnum('lab_result_status', [
  'normal',
  'high',
  'low',
  'critical',
]);

/**
 * Individual lab result values.
 * - Linked to a `lab_order_item` when coming from an order.
 * Optionally linked to a document (PDF report) stored in MinIO.
 */
export const labResult = pgTable('lab_result', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  labOrderItemId: uuid('lab_order_item_id').references(() => labOrderItem.id, {
    onDelete: 'set null',
  }),
  documentId: uuid('document_id').references(() => patientDocument.id, {
    onDelete: 'set null',
  }),
  testName: varchar('test_name', { length: 200 }).notNull(),
  value: varchar('value', { length: 100 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  referenceRange: varchar('reference_range', { length: 120 }),
  status: labResultStatusEnum('status').notNull().default('normal'),
  resultAt: timestamp('result_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  orderedBy: text('ordered_by'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
