import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';

export const medicationTypeEnum = pgEnum('medication_type', [
  'antihypertensives',
  'antiplatelets',
  'anticoagulants',
  'statins',
  'antiarrhythmics',
  'diuretics',
  'diabetes_medications',
]);

export const medicationComplianceEnum = pgEnum('medication_compliance', [
  'good',
  'poor',
]);

export const medication = pgTable('medication', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  dose: varchar('dose', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  type: medicationTypeEnum('type').notNull(),
  compliance: medicationComplianceEnum('compliance'),
  sideEffects: varchar('side_effects', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
