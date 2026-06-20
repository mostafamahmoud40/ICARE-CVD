import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { patient } from './patient.schema';
import { user } from './users.schema';

export const careGoalStatusEnum = pgEnum('care_goal_status', [
  'on-track',
  'off-track',
  'achieved',
]);

export const patientCareGoal = pgTable('patient_care_goal', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id')
    .references(() => patient.id, { onDelete: 'cascade' })
    .notNull(),
  createdByUserId: integer('created_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  metric: varchar('metric', { length: 120 }).notNull(),
  target: varchar('target', { length: 120 }).notNull(),
  currentValue: varchar('current_value', { length: 120 }),
  status: careGoalStatusEnum('status').notNull().default('on-track'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
