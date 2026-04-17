import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { labOrder } from './labOrder.schema';

/** One ordered test within a lab order. */
export const labOrderItem = pgTable('lab_order_item', {
  id: uuid('id').defaultRandom().primaryKey(),
  labOrderId: uuid('lab_order_id')
    .references(() => labOrder.id, { onDelete: 'cascade' })
    .notNull(),
  /** Test display name (what UI shows). */
  testName: varchar('test_name', { length: 200 }).notNull(),
  /** Optional standard codes if you choose to add later (LOINC). */
  loincCode: varchar('loinc_code', { length: 30 }),
  /** Optional grouping label (panel name). */
  panel: varchar('panel', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

