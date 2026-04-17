import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './users.schema';
import { doctor } from './doctor.schema';

export const medicationTypeEnum = pgEnum('medication_type', [
  'antihypertensives',
  'antiplatelets',
  'anticoagulants',
  'statins',
  'antiarrhythmics',
  'diuretics',
  'diabetes_medications',
  'other',
]);

export const medicationComplianceEnum = pgEnum('medication_compliance', [
  'good',
  'poor',
]);

export const medicationStatusEnum = pgEnum('medication_status', [
  'active',
  'paused',
  'discontinued',
]);

export const timeOfDayEnum = pgEnum('time_of_day', [
  'morning',
  'afternoon',
  'evening',
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
  status: medicationStatusEnum('status').notNull().default('active'),
  prescribedBy: uuid('prescribed_by').references(() => doctor.id, {
    onDelete: 'set null',
  }),
  instructions: text('instructions'),
  timeOfDay: timeOfDayEnum('time_of_day')
    .array()
    .notNull()
    .default(['morning']),
  adherencePercent: integer('adherence_percent').notNull().default(100),
  startDate: date('start_date')
    .notNull()
    .default(sql`CURRENT_DATE`),
  durationDays: integer('duration_days'),
  endDate: date('end_date').generatedAlwaysAs(
    sql`CASE WHEN duration_days IS NOT NULL THEN (start_date + duration_days * interval '1 day')::date ELSE NULL END`,
  ),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  discontinuedAt: timestamp('discontinued_at', { withTimezone: true }),
  lastTakenAt: timestamp('last_taken_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
