import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';

export const familyHistory = pgTable('family_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  hasFamilyHistory: boolean('has_family_history').notNull().default(false),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  condition: varchar('condition', { length: 150 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
