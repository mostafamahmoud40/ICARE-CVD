import { integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './users.schema';

export const allergyCategoryEnum = pgEnum('allergy_category', [
  'drug',
  'food',
  'other',
]);

export const allergy = pgTable('allergy', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull(),
  category: allergyCategoryEnum('category').notNull(),
  allergen: varchar('allergen', { length: 150 }).notNull(),
  reaction: varchar('reaction', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
